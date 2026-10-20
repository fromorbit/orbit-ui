import confirmDialogStory from '../overlays/ConfirmDialog.gallery'
import dialogStory from '../overlays/Dialog.gallery'
import dropdownMenuCountsStory from '../overlays/DropdownMenu.counts.gallery'
import dropdownMenuStory from '../overlays/DropdownMenu.gallery'
import dropdownMenuNestedStory from '../overlays/DropdownMenu.nested.gallery'
import popoverStory from '../overlays/Popover.gallery'
import spotlightStory from '../overlays/Spotlight.gallery'
import toastStory from '../overlays/Toast.gallery'
import tooltipStory from '../overlays/Tooltip.gallery'
import bannerStory from '../patterns/Banner.gallery'
import chipStory from '../patterns/Chip.gallery'
import chipListFieldStory from '../patterns/ChipListField.gallery'
import choiceCardStory from '../patterns/ChoiceCard.gallery'
import choiceCardsStory from '../patterns/ChoiceCards.gallery'
import copyButtonStory from '../patterns/CopyButton.gallery'
import editableTableStory from '../patterns/EditableTable.gallery'
import emptyStateStory from '../patterns/EmptyState.gallery'
import errorStateStory from '../patterns/ErrorState.gallery'
import fileLinkStory from '../patterns/FileLink.gallery'
import gitHubLinkStory from '../patterns/GitHubLink.gallery'
import hostedSurfaceStory from '../patterns/HostedSurface.gallery'
import listStory from '../patterns/List.gallery'
import mentionListStory from '../patterns/MentionList.gallery'
import pageHeaderStory from '../patterns/PageHeader.gallery'
import panelTabHeaderStory from '../patterns/PanelTabHeader.gallery'
import pathFieldStory from '../patterns/PathField.gallery'
import pathLabelStory from '../patterns/PathLabel.gallery'
import pickerPillStory from '../patterns/PickerPill.gallery'
import pierreDiffStory from '../patterns/PierreDiff.gallery'
import pierreFileStory from '../patterns/PierreFile.gallery'
import pierreFileIconStory from '../patterns/PierreFileIcon.gallery'
import pierreTreeStory from '../patterns/PierreTree.gallery'
import propertyListStory from '../patterns/PropertyList.gallery'
import proseStory from '../patterns/Prose.gallery'
import railStory from '../patterns/Rail.gallery'
import relativeTimeStory from '../patterns/RelativeTime.gallery'
import roomyListRowStory from '../patterns/RoomyListRow.gallery'
import searchListStory from '../patterns/SearchList.gallery'
import searchListModelsStory from '../patterns/SearchList.models.gallery'
import selectionBarStory from '../patterns/SelectionBar.gallery'
import settingFoldRowStory from '../patterns/SettingFoldRow.gallery'
import settingRowStory from '../patterns/SettingRow.gallery'
import settingsGroupStory from '../patterns/SettingsGroup.gallery'
import shelfGroupStory from '../patterns/ShelfGroup.gallery'
import shimmerStory from '../patterns/Shimmer.gallery'
import stackedRowStory from '../patterns/StackedRow.gallery'
import statusLineStory from '../patterns/StatusLine.gallery'
import statusShapeStory from '../patterns/StatusShape.gallery'
import summaryBarStory from '../patterns/SummaryBar.gallery'
import avatarStory from '../primitives/Avatar.gallery'
import brandIconStory from '../primitives/BrandIcon.gallery'
import buttonStory from '../primitives/Button.gallery'
import checkboxStory from '../primitives/Checkbox.gallery'
import choiceRowStory from '../primitives/ChoiceRow.gallery'
import citeRowStory from '../primitives/CiteRow.gallery'
import collapsibleStory from '../primitives/Collapsible.gallery'
import fieldStory from '../primitives/Field.gallery'
import fileInputStory from '../primitives/FileInput.gallery'
import iconStory from '../primitives/Icon.gallery'
import iconButtonStory from '../primitives/IconButton.gallery'
import iconSegmentedControlStory from '../primitives/IconSegmentedControl.gallery'
import inputStory from '../primitives/Input.gallery'
import kbdStory from '../primitives/Kbd.gallery'
import levelBarsStory from '../primitives/LevelBars.gallery'
import numberFieldStory from '../primitives/NumberField.gallery'
import orbitWordmarkStory from '../primitives/OrbitWordmark.gallery'
import pillStory from '../primitives/Pill.gallery'
import progressMeterStory from '../primitives/ProgressMeter.gallery'
import projectMarkStory from '../primitives/ProjectMark.gallery'
import radioGroupStory from '../primitives/RadioGroup.gallery'
import resizeHandleStory from '../primitives/ResizeHandle.gallery'
import scrollAreaStory from '../primitives/ScrollArea.gallery'
import secretFieldStory from '../primitives/SecretField.gallery'
import sectionHeadingStory from '../primitives/SectionHeading.gallery'
import segmentedControlStory from '../primitives/SegmentedControl.gallery'
import selectStory from '../primitives/Select.gallery'
import separatorStory from '../primitives/Separator.gallery'
import skeletonStory from '../primitives/Skeleton.gallery'
import spinnerStory from '../primitives/Spinner.gallery'
import stepChipsStory from '../primitives/StepChips.gallery'
import switchStory from '../primitives/Switch.gallery'
import tabsStory from '../primitives/Tabs.gallery'
import tagStory from '../primitives/Tag.gallery'
import textareaStory from '../primitives/Textarea.gallery'
import thumbnailStory from '../primitives/Thumbnail.gallery'
import toggleStory from '../primitives/Toggle.gallery'
import { collectStories, type Story } from './story'

/**
 * The Dutch words the stories hand their components (`nl` of `testing/labels.ts`): a fixture of
 * the gallery, public so a host's gallery and tests can show and check the same words.
 *
 * Exported here and not from `./testing`, since `renderWithUi` is for a host's own catalogue; the
 * library itself still holds no text.
 */
export { nl as galleryLabels } from '../testing/labels'
export { collectStories, type Story, stateId, storyId } from './story'

/**
 * Every story of the library, by group and then by title: the `./gallery` export of
 * `@fromorbit/ui`.
 *
 * One import per `*.gallery.tsx`, written out: a built library knows no `import.meta.glob`, so a
 * host could not collect them itself. `index.test.ts` fails when a story file is missing here or
 * listed twice. Sorted with {@link collectStories}, so a host that adds stories of its own and
 * sorts again keeps the same order.
 */
export const stories: Story[] = collectStories([
  confirmDialogStory,
  dialogStory,
  dropdownMenuCountsStory,
  dropdownMenuStory,
  dropdownMenuNestedStory,
  popoverStory,
  spotlightStory,
  toastStory,
  tooltipStory,
  bannerStory,
  chipStory,
  chipListFieldStory,
  choiceCardStory,
  choiceCardsStory,
  copyButtonStory,
  editableTableStory,
  emptyStateStory,
  errorStateStory,
  fileLinkStory,
  gitHubLinkStory,
  hostedSurfaceStory,
  listStory,
  mentionListStory,
  pageHeaderStory,
  panelTabHeaderStory,
  pathFieldStory,
  pathLabelStory,
  pickerPillStory,
  pierreDiffStory,
  pierreFileStory,
  pierreFileIconStory,
  pierreTreeStory,
  propertyListStory,
  proseStory,
  railStory,
  relativeTimeStory,
  roomyListRowStory,
  searchListStory,
  searchListModelsStory,
  selectionBarStory,
  settingFoldRowStory,
  settingRowStory,
  settingsGroupStory,
  shelfGroupStory,
  shimmerStory,
  stackedRowStory,
  statusLineStory,
  statusShapeStory,
  summaryBarStory,
  avatarStory,
  brandIconStory,
  buttonStory,
  checkboxStory,
  choiceRowStory,
  citeRowStory,
  collapsibleStory,
  fieldStory,
  fileInputStory,
  iconStory,
  iconButtonStory,
  iconSegmentedControlStory,
  inputStory,
  kbdStory,
  levelBarsStory,
  numberFieldStory,
  orbitWordmarkStory,
  pillStory,
  progressMeterStory,
  projectMarkStory,
  radioGroupStory,
  resizeHandleStory,
  scrollAreaStory,
  secretFieldStory,
  sectionHeadingStory,
  segmentedControlStory,
  selectStory,
  separatorStory,
  skeletonStory,
  spinnerStory,
  stepChipsStory,
  switchStory,
  tabsStory,
  tagStory,
  textareaStory,
  thumbnailStory,
  toggleStory,
])
