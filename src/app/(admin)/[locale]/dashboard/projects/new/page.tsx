import AdminForm from "@/components/ui/AdminForm";
import { createProject } from "./actions";

export default function NewProjectPage() {
  return (
    <AdminForm
      title="Create New Project"
      submitLabel="Create project"
      action={createProject}
    />
  );
}
