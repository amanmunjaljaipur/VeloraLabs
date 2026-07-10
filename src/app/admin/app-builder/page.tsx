import { redirect } from "next/navigation";

/** Classic App Builder studio removed — use Forge. */
export default function AdminAppBuilderRemoved() {
  redirect("/admin/forge");
}
