
// █▀▀ █▀█ ▄▀█ █░░   █▀▀ ▄▀█ ▀█▀ █▀▀ █▀▀ █▀█ █▀█ █▄█
// █▄█ █▄█ █▀█ █▄▄   █▄▄ █▀█ ░█░ ██▄ █▄█ █▄█ █▀▄ ░█░

import GoalService from '../../services/goals.js'
import GoalBox from './_goalBox.js'

function CategoryContainer (category, isBigPicture = false) {
  /**
   * The category header.
   */
  const Label = Widget.Label({
    className: isBigPicture ? 'big-picture-header' : 'category-header',
    label: isBigPicture ? 'The big picture' : category,
    xalign: 0,
    wrap: true,
    maxWidthChars: 20,
  })

  /**
   * Container for the top-level contents within this category.
   */
  const GoalboxList = Widget.Box({
    vertical: false,
    attribute: { currentIndex: 0 },
    spacing: 12,
    setup: self => {
      const root = GoalService.data[category].children

      /* Apply filters */
      if (isBigPicture) {
        self.children = root.map(goal => GoalBox(goal, isBigPicture))
      } else {
        self.children = root.reduce(function(filteredArray, goal) {
          const statusMatch = (GoalService.ui_settings.completed && goal.status == 'completed') ||
                              (GoalService.ui_settings.pending && goal.status == 'pending') ||
                              (GoalService.ui_settings.failed && goal.status == 'failed') ||
                              (!GoalService.ui_settings.completed && !GoalService.ui_settings.pending && !GoalService.ui_settings.failed)

          const stateMatch = (GoalService.ui_settings.developed && goal.due && goal.why) ||
                             (GoalService.ui_settings.undeveloped && (!goal.due || !goal.why)) ||
                             (!GoalService.ui_settings.developed && !GoalService.ui_settings.undeveloped) ||
                             (GoalService.ui_settings.developed && GoalService.ui_settings.undeveloped)

          if (statusMatch && stateMatch) {
            filteredArray.push(GoalBox(goal, isBigPicture))
          }

          return filteredArray
        }, [])
      }
    }
  })

  const Container = Widget.Scrollable({
    className: 'scroll',
    hscroll: 'always',
    vscroll: 'never',
    hexpand: true,
    vexpand: false,
    overlayScrolling: false,
    child: GoalboxList,
  })

  return Widget.Box({
    spacing: 4,
    vertical: true,
    children: [
      Label,
      Container,
    ],
    attribute: {
      numGoals: GoalboxList.children.length,
      list: GoalboxList,
    },
    setup: self => {
      /* Keyboard navigation */
      self.hook(GoalService, (self) => {self.attribute.currentIndex = 0}, 'render-goals')

      self.attribute.focusFirstGoal = () => {
        self.attribute.list.children[0].emit('grab-focus')
      }

      self.attribute.focusNextGoal = (dir) => {
        /* Calculate index of next node to focus */
        self.attribute.currentIndex = (self.attribute.currentIndex + dir) % GoalboxList.children.length
        if (self.attribute.currentIndex < 0) self.attribute.currentIndex = GoalboxList.children.length - 1

        self.attribute.list.children[self.attribute.currentIndex].emit('grab-focus')
      }
    }
  })
}

export default () => Widget.Box({
  vertical: true,
  spacing: 30,
  attribute: { currentCategory: 0 },
  setup: (self) => {

    /* Keyboard navigation */
    self.attribute.focusCategory = (dir) => {
      /* Calc next category based on direction (1 for next, -1 for prev) */
      self.attribute.currentCategory = (self.attribute.currentCategory + dir) % self.children.length
      if (self.attribute.currentCategory < 0) self.attribute.currentCategory = self.children.length - 1

      self.children[self.attribute.currentCategory].attribute.focusFirstGoal()
    }

    self.attribute.focusNext = (dir) => {
      self.children[self.attribute.currentCategory].attribute.focusNextGoal(dir)
    }
    
    self.attribute.focusFirst = () => {
      self.attribute.currentCategory = 0
      self.children[0].attribute.focusFirstGoal()
    }

    self.attribute.focusLast = () => {
      self.attribute.currentCategory = self.children.length - 1
      self.children[self.children.length - 1].attribute.focusFirstGoal()
    }

    /* Rerender UI on render-goals signal */
    self.hook(GoalService, (self, data) => {
      if (data == undefined) return

      log('goalTab', 'Rendering goals')

      self.attribute.currentCategory = 0

      self.children.forEach(x => x.destroy())

      self.add(CategoryContainer('_bigpicture', true))

      const categories = Object.keys(data).sort()
      categories.forEach(category => {
        if (category != '_bigpicture') {
          const categoryContainer = CategoryContainer(category)
          if (categoryContainer.attribute.numGoals > 0) {
            self.add(categoryContainer)
          } else {
            categoryContainer.destroy()
          }
        }
      })
    }, 'render-goals')
    }
})
