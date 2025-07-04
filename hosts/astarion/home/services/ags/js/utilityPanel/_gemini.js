
/* █▀▀ █▀▀ █▀▄▀█ █ █▄░█ █   ▄▀█ █▀█ █ */
/* █▄█ ██▄ █░▀░█ █ █░▀█ █   █▀█ █▀▀ █ */

/**
 * Idea and UI inspiration taken from kotontrion's chatgpt widget,
 * as posted in unixporn discord
 * (this code sucks btw)
 */

import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk?version=3.0'
import Gdk from 'gi://Gdk'
import GtkSource from 'gi://GtkSource?version=3.0'
import GLib from 'gi://GLib'
import UserConfig from '../../userconfig.js'

/********************************************************
 * MODULE-LEVEL VARIABLES
 ********************************************************/

const CUSTOM_SOURCEVIEW_SCHEME_PATH = `${App.configDir}/assets/gtksourceview/nord.xml`

const GEMINI_API_KEY = UserConfig.gemini.api

const TextView = Widget.subclass(Gtk.TextView)

let responsesRaw = []
const responses = Variable([])

let optConcise  = Variable(true)
let optContinue = Variable(false)

/********************************************************
 * FUNCTIONS
 ********************************************************/

/**
 * Escape quotes
 * (CANNOT get this to work so im just removing it all for now)
 */
const escapeQuotes = (text) => {
  text = text.replaceAll('"', '')
  text = text.replaceAll("'", '')
  return text
}

/**
 * Gemini responses have markdown markup. GJS only renders Pango markup.
 * Convert it here.
 * Taken from end-4's excellent config
 * https://github.com/end-4/CirnOS/blob/24a79b1b371c77ff7f8e6584b8551dbe67612b6c/homes/end/.config/ags/lib/md2pango.js#L1
 */
const markdownToPangoMarkup = (text) => {
  const monospaceFonts = 'JetBrains Mono NF, JetBrains Mono Nerd Font, JetBrains Mono NL, SpaceMono NF, SpaceMono Nerd Font, monospace'

  const replacements = {
    'indents': [
      { name: 'BULLET', re: /^(\s*)([\*\-]\s)(.*)(\s*)$/, sub: ' $1- $3' },
      { name: 'NUMBERING', re: /^(\s*[0-9]+\.\s)(.*)(\s*)$/, sub: ' $1 $2' },
    ],
    'escapes': [
      { name: 'COMMENT', re: /<!--.*-->/, sub: '' },
        { name: 'AMPERSTAND', re: /&/g, sub: '&amp;' },
        { name: 'LESSTHAN', re: /</g, sub: '&lt;' },
      { name: 'GREATERTHAN', re: />/g, sub: '&gt;' },
    ],
    'sections': [
      { name: 'H1', re: /^(#\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="170%">$2</span>' },
      { name: 'H2', re: /^(##\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="150%">$2</span>' },
      { name: 'H3', re: /^(###\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="125%">$2</span>' },
      { name: 'H4', re: /^(####\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="100%">$2</span>' },
      { name: 'H5', re: /^(#####\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="90%">$2</span>' },
    ],
    'styles': [
      { name: 'BOLD', re: /(\*\*)(\S[\s\S]*?\S)(\*\*)/g, sub: "<b>$2</b>" },
      { name: 'UND', re: /(__)(\S[\s\S]*?\S)(__)/g, sub: "<u>$2</u>" },
      { name: 'EMPH', re: /\*(\S.*?\S)\*/g, sub: "<i>$1</i>" },
      // { name: 'EMPH', re: /_(\S.*?\S)_/g, sub: "<i>$1</i>" },
      { name: 'HEXCOLOR', re: /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g, sub: '<span bgcolor="#$1" fgcolor="#000000" font_family="' + monospaceFonts + '">#$1</span>' },
      { name: 'INLCODE', re: /(`)([^`]*)(`)/g, sub: '<span font_weight="bold" font_family="' + monospaceFonts + '">$2</span>' },
      // { name: 'UND', re: /(__|\*\*)(\S[\s\S]*?\S)(__|\*\*)/g, sub: "<u>$2</u>" },
    ],
  }

  const replaceCategory = (text, replaces) => {
    for (const type of replaces) {
      text = text.replace(type.re, type.sub)
    }
    return text
  }

  let lines = text.split('\n')
  let output = []
  // Replace
  for (const line of lines) {
    let result = line
    result = replaceCategory(result, replacements.indents)
    result = replaceCategory(result, replacements.escapes)
    result = replaceCategory(result, replacements.sections)
    result = replaceCategory(result, replacements.styles)
    output.push(result)
  }
  // Remove trailing whitespaces
  output = output.map(line => line.replace(/ +$/, ''))
  return output.join('\n')
}

/** 
 * Tokenize on code snippets
 */
const tokenizeCode = (markdown) => {
  const tokens = []

  let remainingStr = markdown
  let isCode = false

  while (remainingStr != '') {
    const match = remainingStr.match('```')

    if (match) {
      /* Grab language */
      let lang = undefined
      if (isCode) {
        lang = remainingStr.split(/\s+/)[0]
        remainingStr = remainingStr.slice(lang.length)
      }

      tokens.push({
        type: isCode ? 'code' : 'text',
        content: remainingStr.substring(0, (isCode ? match.index - lang.length : match.index)),
        language: lang
      })

      remainingStr = remainingStr.slice(tokens[tokens.length - 1].content.length + 3)
    } else {
      tokens.push({ type: 'text', content: remainingStr })
      remainingStr = ''
    }

    isCode = !isCode
  }

  return tokens
}

/**
 * Given a responses[] item, return either a prompt widget or response widget.
 */
const promptResults = (promptData) => {
  if ('prompt' == promptData.type) {
    return promptInput(promptData.content)
  } else if ('response' == promptData.type) {
    return promptOutput(promptData.content)
  }
}

/**
 * Language reported by Gemini for code snippets doesn't exactly match the 
 * GtkSourceView language; convert here
 */
const sourceviewSubstitueLang = (lang) => {
  const substitutions = {
    /* from -> to */
    'bash': 'sh',
    'javascript': 'js',
    'c++': 'cpp',
    'markdown': 'md',
  }

  return substitutions[lang] ? substitutions[lang] : lang
}

/**
 * Load custom colorscheme for GtkSourceView
 */
const sourceviewLoadScheme = (path = CUSTOM_SOURCEVIEW_SCHEME_PATH) => {
  const file = Gio.File.new_for_path(path)
  const [success, contents] = file.load_contents(null)

  if (!success) {
    console.log('sourceviewLoadScheme: Failed to load theme XML file');
    return
  }

  /* Parse the XML content and set the Style Scheme */
  const schemeManager = GtkSource.StyleSchemeManager.get_default()
  schemeManager.append_search_path(file.get_parent().get_path())
}

sourceviewLoadScheme()

/********************************************************
 * WIDGET DEFINITIONS
 ********************************************************/

/**
 * Section header and button to clear all prompts and responses.
 */
const Header = () => Widget.Box({
  vertical: false,
  className: 'section-header',
  children: [
    Widget.Label({
      hpack: 'start',
      xalign: 0,
      label: 'Gemini',
    }),
  ]
})

/**
 * Return code highlighted with GtkSourceView
 */
const HighlightedCode = (content, lang) => {
  const buffer = new GtkSource.Buffer()
  const sourceView = new GtkSource.View({
    buffer: buffer,
    wrap_mode: Gtk.WrapMode.NONE,
    editable: false,
    canFocus: false,
  })
  
  /* Set language */
  const langManager = GtkSource.LanguageManager.get_default()
  let displayLang = langManager.get_language(sourceviewSubstitueLang(lang)) // Set your preferred language
  if (displayLang) {
    buffer.set_language(displayLang)
  }

  /* Apply theme */
  const schemeManager = GtkSource.StyleSchemeManager.get_default()
  buffer.set_style_scheme(schemeManager.get_scheme(UserConfig.currentTheme))

  /* Set content */
  buffer.set_text(content.trim(), -1)

  /* Hot reload theme */
  systemTheme.connect('changed', (theme) => {
    buffer.set_style_scheme(schemeManager.get_scheme(theme.value))
  })

  return sourceView
}

/**
 * Options
 */
const Options = () => {
  /* Give concise responses */
  const OptConcise = (opt) => Widget.ToggleButton({
    className: 'option',
    active: optConcise.bind(),
    child: Widget.Label('Concise'),
    onToggled: self => { 
      if (self.active != optConcise.value) {
        optConcise.value = !optConcise.value
      }
    },
  })
  
  /* Continue prior conversation history */
  const OptContinue = (opt) => Widget.ToggleButton({
    className: 'option',
    active: optContinue.bind(),
    child: Widget.Label('Continue conversation'),
    onToggled: self => { 
      if (self.active != optContinue.value) {
        optContinue.value = !optContinue.value
      }
    },
  })

  const Clear = () => Widget.Button({
    hpack: 'end',
    className: 'option',
    child: Widget.Box({
      spacing: 8,
      vertical: false,
      children: [
        Widget.Icon('trash-symbolic'),
        Widget.Label({
          label: 'Clear'
        }),
      ]
    }),
    onClicked: () => {
      responsesRaw = []
      responses.setValue(responsesRaw)
    }
  })

  return Widget.Box({
    vertical: false,
    spacing: 12,
    className: 'options',
    children: [
      Clear(),
      OptConcise(),
      OptContinue(),
    ]
  })
}

/**
 * Text entry box for prompts.
 * Also includes the Gemini API call.
 */
const EntryBox = () => {
  const entryBox = Widget.Entry({
    className: 'entry',
    hexpand: true,
    placeholderText: 'Talk to Gemini',
    onAccept: (self) => {
      const text = self.get_text()
      if (text == '') return

      self.set_text('')

      responsesRaw.push({ type: 'prompt', content: text })
      responsesRaw.push({ type: 'response', content: 'Thinking...' })
      responses.setValue(responsesRaw)

      /* Set options */
      let continueConversation = optContinue.value ? responsesRaw.map(x => escapeQuotes(x.content)).join(' ') : ''
      let concise = optConcise.value ? 'answer concisely' : ''

      const cmd = `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}" \
                  -H 'Content-Type: application/json' -X POST -d '{ "contents": [{ "parts":[{"text": "${continueConversation} ${escapeQuotes(text)} ${concise}"}] }] }'`

      Utils.execAsync(cmd)
        .then(out => {
          const result = JSON.parse(out)
          const output = result.candidates[0].content.parts[0].text

          responsesRaw[responsesRaw.length - 1].content = output
          responses.setValue(responsesRaw)

        })
        .catch(err => console.log(`Gemini: ${err}`))
    },
  })

  return Widget.Box({
    className: 'entry-container',
    hexpand: true,
    children: [
      entryBox,
      Widget.Icon({
        widthRequest: 24,
        icon: 'paper-plane-tilt-symbolic',
      }),
    ]
  })
}

/**
 * Text displaying prompt.
 */
const promptInput = (input) => {
  return Widget.Box({
    className: 'prompt-input',
    vertical: true,
    vexpand: false,
    hexpand: false,
    children: [
      Widget.Label({
        xalign: 0,
        className: 'header',
        label: UserConfig.profile.name
      }),
      TextView({
        vexpand: true,
        hexpand: false,
        canFocus: false,
        className: 'content',
        setup: self => {
          self.set_wrap_mode(true)
          self.set_editable(false)
          self.set_accepts_tab(false)
          self.buffer.text = input
        }
      })
    ]
  })
}

/**
 * Text displaying response to prompt.
 */
const promptOutput = (output) => {
  /**
   * Helper function to create text widget
   */
  const _promptOutputText = (token) => {
    return TextView({
      vexpand: true,
      hexpand: false,
      className: 'content',
      canFocus: false,
      setup: self => {
        self.set_wrap_mode(true)
        self.set_editable(false)
        self.set_accepts_tab(false)
        self.buffer.insert_markup(self.buffer.get_end_iter(),
                                  markdownToPangoMarkup(token.content.trim()),
                                  -1)
      }
    })
  }

  /**
   * Helper function to create code block widget
   */
  const promptOutputCodeSnippet = (token) => {
    const codeSnippetHeader = Widget.CenterBox({
      hexpand: false,
      className: 'code-block-header',
      startWidget: Widget.Label({
        hpack: 'start',
        label: token.language.trim().charAt(0).toUpperCase() + token.language.trim().slice(1)
      }),
      endWidget: Widget.Button({
        attribute: {content: escapeQuotes(token.content.trim())},
        hpack: 'end',
        hexpand: false,
        className: 'copy-btn',
        canFocus: false,
        child: Widget.Box({
          hexpand: false,
          spacing: 5,
          vertical: false,
          children: [
            Widget.Icon('copy-symbolic'),
            Widget.Label('Copy'),
          ]
        }),
        onClicked: (self) => {
          const cmd = `bash -c "echo '${self.attribute.content.trim()}' | wl-copy 2>/dev/null"`
          Utils.execAsync(cmd).catch(err => print)
        }
      })
    })

    let codeSnippetContent

    codeSnippetContent = Widget.Box({
      className: 'code-block-content',
      hexpand: false,
      vexpand: true,
      children: [
        Widget.Scrollable({
          overlayScrolling: true,
          canFocus: false,
          hscroll: 'automatic',
          vscroll: 'never',
          vexpand: true,
          hexpand: true,
          child: HighlightedCode(token.content.trim(), token.language),
        })
      ]
    })

    return Widget.Box({
      className: 'code-block',
      vertical: true,
      hexpand: false,
      children: [
        codeSnippetHeader,
        codeSnippetContent,
      ],
    })
  }
  
  /**
   * Helper function to create code block widget
   */
  const _createPromptOutputWidgets = (token) => {
    if ('text' == token.type) {
      return _promptOutputText(token)
    } else if ('code' == token.type) {
      return promptOutputCodeSnippet(token)
    }
  }

  /* Tokenize on code snippets */
  let tokens = []
  if (output.includes('```')) {
    tokens = tokenizeCode(output)
  } else {
    tokens = [{type: 'text', content: output}]
  }

  return Widget.Box({
    className: 'prompt-output',
    vertical: true,
    vexpand: false,
    hexpand: false,
    children: [
      Widget.Label({
        xalign: 0,
        className: 'header',
        label: 'Gemini',
      }),
      Widget.Box({
        vertical: true,
        spacing: 6,
        children: tokens.map(_createPromptOutputWidgets)
      })
    ]
  })
}

const ContentContainer = () => Widget.Scrollable({
  hscroll: 'never',
  vscroll: 'always',
  vexpand: true,
  hexpand: false,
  canFocus: false,
  css: 'padding: 1px',
  child: Widget.Box({
    className: 'response-container',
    spacing: 12,
    vertical: true,
    children: responses.bind().as(x => x.map(promptResults))
  }),
})

/**
 * Final widget composition
 */
export default () => Widget.Box({
  className: 'gemini',
  vexpand: true,
  hexpand: true,
  vertical: true,
  children: [
    Header(),
    ContentContainer(),
    Options(),
    EntryBox(),
  ]
})
