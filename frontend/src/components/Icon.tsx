// Deep `lucide-react-native/icons/*` imports, not the barrel. Metro does not
// tree-shake the barrel: importing seven icons from it pulled all ~1768 into
// the bundle and cost 1.7 MB (measured). These per-icon subpaths are a public
// entry in the package's `exports` map, so this is supported, not a reach into
// internals.
import BookOpen from "lucide-react-native/icons/book-open";
import Calendar from "lucide-react-native/icons/calendar";
import ChartColumn from "lucide-react-native/icons/chart-column";
import Settings from "lucide-react-native/icons/settings";
import Square from "lucide-react-native/icons/square";
import SquareCheck from "lucide-react-native/icons/square-check";
import SquarePen from "lucide-react-native/icons/square-pen";
import { sizing } from "../theme/tokens";

/**
 * The single icon surface for the app.
 *
 * Everything routes through here for two reasons. First, `strokeWidth` is
 * pinned to one token, so the 2px Tidepool stroke cannot drift icon by icon —
 * this is the whole reason we left Ionicons, which bakes its weight into the
 * glyph and offers no way to set it. Second, lucide ships ~1768 icons and
 * Metro's tree-shaking of it is not something to rely on; keeping the named
 * imports in one file bounds what can reach the bundle and makes the set easy
 * to audit or swap wholesale.
 *
 * Add an icon by naming it here, never by importing lucide at a call site —
 * and add it as a deep import, for the bundle-size reason noted above.
 */
const ICONS = {
  log: SquarePen,
  history: Calendar,
  progress: ChartColumn,
  resources: BookOpen,
  settings: Settings,
  checkboxOn: SquareCheck,
  checkboxOff: Square,
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  color: string;
  /** Defaults to the 24px grid lucide draws on. */
  size?: number;
};

export default function Icon({ name, color, size = sizing.tabIcon }: IconProps) {
  const Glyph = ICONS[name];
  return <Glyph size={size} color={color} strokeWidth={sizing.iconStroke} />;
}
