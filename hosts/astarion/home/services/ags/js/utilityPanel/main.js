
import Gemini from './_gemini.js'

/******************************************
 * MODULE-LEVEL VARIABLES
 ******************************************/

const revealerState = Variable(false)

/******************************************
 * WIDGETS
 ******************************************/

const StackSwitcher = () => {
}

const Stack = () => {

}

const UtilityPanel = () => Widget.Box({
  className: 'utility',
  children: [
    Gemini(),
  ]
})

export default () => Widget.Window({
  name: 'utility',
  attribute: revealerState,
  exclusivity: 'normal',
  layer: 'top',
  visible: 'false',
  anchor: ['top', 'left', 'bottom'],
  keymode: 'on-demand',
  child: Widget.Box({
    css: 'padding: 1px',
    child: Widget.Revealer({
      revealChild: revealerState.bind(),
      transitionDuration: 250,
      transition: 'slide_left',
      child: UtilityPanel(),
    })
  })
})
