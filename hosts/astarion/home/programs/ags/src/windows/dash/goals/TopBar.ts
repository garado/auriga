/**
 * ▀█▀ █▀█ █▀█   █▄▄ ▄▀█ █▀█
 * ░█░ █▄█ █▀▀   █▄█ █▀█ █▀▄
 *
 * Top bar component for the Goals application.
 * Provides search functionality and filtering controls for goal management.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, hook, Widget } from "astal/gtk4";
import { bind } from "astal";
import Goals from "@/services/Goals";
import { SegmentedButtonGroup } from "@/components/SegmentedButtonGroup";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let goalsService: InstanceType<typeof Goals> | undefined = undefined;

/*****************************************************************************
 * Constants
 *****************************************************************************/

/** CSS class names used throughout the top bar component */
const CSS_CLASSES = {
  topBar: "top-bar",
  header: "header",
  searchContainer: "search-container",
  filters: "filters",
} as const;

/** Icon names used in the component */
const ICONS = {
  search: "magnifying-glass-symbolic",
} as const;

/** UI spacing and layout constants */
const LAYOUT = {
  mainSpacing: 6,
  searchSpacing: 3,
  filtersSpacing: 12,
} as const;

/** Filter button configurations */
const FILTER_CONFIGS = {
  progress: [
    { key: "completed", label: "Completed" },
    { key: "pending", label: "In progress" },
    { key: "failed", label: "Failed" },
  ],
  status: [
    { key: "developed", label: "Developed" },
    { key: "undeveloped", label: "In development" },
  ],
  timescale: [
    { key: "short", label: "Short term" },
    { key: "med", label: "Mid term" },
    { key: "long", label: "Long term" },
    { key: "aspirational", label: "Aspirational" },
  ],
} as const;

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Main header label for the Goals section.
 * @returns Widget containing the header label
 */
const HeaderLabel = () =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.header],
    label: "Goals",
    justify: Gtk.Justification.LEFT,
  });

/**
 * Search input field.
 * @returns Widget for goal search functionality
 */
const SearchEntry = () =>
  Widget.Entry({
    canFocus: true,
    focusOnClick: true,
    focusable: true,
    placeholderText: "search...",
    onKeyReleased: (self) => {
      goalsService!.search = self.text;
    },
  });

/**
 * Search container with icon and input field.
 * @returns Widget containing search interface
 */
const SearchContainer = () => {
  const searchEntry = SearchEntry();

  return Widget.Box({
    cssClasses: [CSS_CLASSES.searchContainer],
    vertical: false,
    spacing: LAYOUT.searchSpacing,
    children: [
      Widget.Image({
        iconName: ICONS.search,
      }),
      searchEntry,
    ],
  });
};

/**
 * Creates a filter button group based on configuration.
 * @param filterConfig - Array of filter configurations
 * @param updateCallback - Optional callback for updating filters (defaults to standard filter update)
 * @returns Widget containing segmented button group for filters
 */
const FilterButtonGroup = (
  filterConfig: readonly { key: string; label: string }[],
  updateCallback?: (key: string) => void,
) => {
  /**
   * Default filter update handler.
   * @param filterKey - The filter key to toggle
   */
  const defaultUpdateHandler = (filterKey: string) => {
    const filters = goalsService!.filters;
    filters[filterKey] = !filters[filterKey];
    goalsService!.filtersUpdated();
  };

  const buttons = filterConfig.map(({ key, label }) => ({
    name: label,
    active: bind(goalsService!, "filters").as(
      (filters) => (filters as Record<string, boolean>)[key],
    ),
    action: () => {
      if (updateCallback) {
        updateCallback(key);
      } else {
        defaultUpdateHandler(key);
      }
    },
  }));

  return SegmentedButtonGroup({ buttons });
};

/**
 * Creates a category selection widget that displays available goal categories.
 * @returns Widget for category selection
 */
const CategorySelector = () =>
  Widget.Box({
    setup: (self) => {
      /**
       * Handles the render-goals event to populate categories.
       * @param self - The widget instance
       * @param categorizedGoals - Data containing goals organized by category
       */
      const handleGoalsRender = (
        self: any,
        categorizedGoals: Record<string, any>,
      ) => {
        if (categorizedGoals === undefined) return;

        const sortedCategories = Object.keys(categorizedGoals).sort();

        sortedCategories.forEach((categoryName: string) => {
          self.append(
            Widget.Label({
              label: categoryName,
            }),
          );
        });
      };

      hook(self, goalsService!, "render-goals", handleGoalsRender);
    },
  });

/**
 * Creates the top section of the top bar containing header and search.
 * @returns Widget containing header and search controls
 */
const TopSection = () =>
  Widget.CenterBox({
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: HeaderLabel(),
    endWidget: SearchContainer(),
  });

/**
 * Creates the bottom section of the top bar containing filter controls.
 * @returns Widget containing all filter button groups
 */
const BottomSection = () => {
  const filtersContainer = Widget.Box({
    cssClasses: [CSS_CLASSES.filters],
    spacing: LAYOUT.filtersSpacing,
    children: [
      FilterButtonGroup(FILTER_CONFIGS.progress),
      FilterButtonGroup(FILTER_CONFIGS.status),
      FilterButtonGroup(FILTER_CONFIGS.timescale),
    ],
  });

  return Widget.CenterBox({
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: filtersContainer,
  });
};

/**
 * Main top bar component for the Goals application.
 * Provides search functionality and comprehensive filtering controls.
 * @returns Widget containing the complete top bar interface
 */
export default () => {
  goalsService = Goals.get_default();

  return Widget.Box({
    cssClasses: [CSS_CLASSES.topBar],
    vertical: true,
    spacing: LAYOUT.mainSpacing,
    children: [TopSection(), BottomSection()],
  });
};
