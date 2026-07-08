import { redirect } from "next/navigation";

export default function AdminChatbotRedirectPage() {
  redirect("/admin/chatbot-training");
}