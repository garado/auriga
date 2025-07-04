
/* █▄░█ █▀█ █░█░█   █▀█ █▀▀ ▄▀█ █▀▄ █ █▄░█ █▀▀ */
/* █░▀█ █▄█ ▀▄▀▄▀   █▀▄ ██▄ █▀█ █▄▀ █ █░▀█ █▄█ */

/* 
 * Displays the books I'm currently reading and their progress.
 * Book data is stored with Taskwarrior. It will look for tasks tag:books
 * and project:in-progress.
 */

import TaskService from '../../services/task.js'

/*****************************************
 * MODULE-LEVEL VARS
 *****************************************/

const TMPDIR = '/tmp/ags/book/'

/*****************************************
 * SERVICE
 *****************************************/

class BookService extends Service {
  static {
    Service.register (
      this,
      /* Signals */
      { },

      /* Properties */
      { 
        'covers': ['jsobject'],
      },
    )
  }
  
  constructor() {
    super()
  }

  #covers = []
  
  get covers() {
    return this.#covers
  }

  /**
   * @function fetchCover
   * @brief Retrieve book cover from cache or from web
   * @param bookTask A Taskwarrior
   */
  fetchCoverPath(bookTask) {
    /* Check cache for cover.
     * Cover images are stored in the cache using the task UUID. */
    const exists = Utils.exec(`bash -c "test -f ${TMPDIR}${bookTask.uuid} || echo 'false'"`)

    if (exists == 'false') {
      /* Parse title and author from description.
       * My book tasks follow the format 'Author - Title' */
      const fields = bookTask.description.split(" - ")
      const author = fields[0].replace(/\s/g, '+')
      const title = fields[1].replace(/\s/g, '+')

      const url = `https://bookcover.longitood.com/bookcover?book_title=${title}&author_name=${author}`

      Utils.execAsync(`curl ${url}`)
          .then(x => {
            const imgURL = JSON.parse(x).url
            this.downloadCover(imgURL, bookTask)
          })
          .catch(console.error)
    } else {
      this.#covers.push(bookTask)
      this.notify('covers')
    }
  }

  downloadCover(url, bookTask) {
    const tmpPath = `${TMPDIR}/${bookTask.uuid}`
    Utils.execAsync(`bash -c "curl ${url} > ${tmpPath}"`)
      .then(() => {
        this.#covers.push(bookTask)
        this.notify('covers')
      })
      .catch(console.error)
  }

}

const service = new BookService()

/*****************************************
 * WIDGETS
 *****************************************/

const Cover = () => Widget.Box({
  heightRequest: 220,
  widthRequest: 130,
  className: 'cover',
  hpack: 'end',
  css: service.bind('covers').as(x => `background-image: url('${TMPDIR}/${x[0].uuid}')`),
  setup: self => {

    self.hook(TaskService, (self, tag, project) => {
      if (tag == undefined || project == undefined) return
      if (tag != 'books' || project != 'in-progress') return

      const bookData = TaskService.queryTasks(tag, project).tasks
      service.fetchCoverPath(bookData[0])
    }, 'fetch-finished')
  }
})

const Info = () => Widget.Box({
  className: 'info',
  vertical: true,
  vpack: 'center',
  hpack: 'center',
  children: [
    Widget.Label({
      className: 'title',
      label: service.bind('covers').as(x => x[0] ? x[0].description.split(" - ")[1] : ''),
      xalign: 0,
    }),
    Widget.Label({
      className: 'author',
      label: service.bind('covers').as(x => x[0] ? x[0].description.split(" - ")[0] : ''),
      xalign: 0,
    }),
    Widget.Box({
      className: 'quote',
      halign: 'bottom',
      vexpand: false,
      vertical: false,
      children: [
        Widget.Icon('book-symbolic'),
        Widget.Label({
          hexpand: false,
          vexpand: false,
          wrap: true,
          label: "When a man cannot choose, he ceases to be a man.",
        })
      ]
    }),
    // Widget.LevelBar({
    //   className: 'progress',
    //   barMode: 'discrete',
    //   vertical: false,
    //   value: 27,
    //   maxValue: 100,
    // })
  ]
})

export default () => Widget.Box({
  className: 'book',
  vexpand: true,
  vertical: true,
  children: [
    Widget.CenterBox({
      spacing: 20,
      hexpand: true,
      vertical: false,
      startWidget: Cover(),
      endWidget: Info(),
    })
  ],
});
