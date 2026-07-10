import { redirect } from "next/navigation";

/** Classic App Builder studio removed. */
export default function AdminAppBuilderRemoved() {
  redirect("/admin");
}
