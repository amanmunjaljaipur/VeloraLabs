import { ChatbotTrainingPanel } from "@/components/admin/ChatbotTrainingPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Chatbot Training",
  description: "Manage labeled Q&A training data for the Verlin Labs assistant.",
};

export default async function ChatbotTrainingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/chatbot-training");
  }

  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Chatbot Training"
        subtitle="Curate labeled question–answer pairs, import from Excel, export backups, and retrain the on-site assistant — no external API required."
      />
      <ChatbotTrainingPanel />
    </>
  );
}