import { createProject } from "./actions";

export default function NewProjectPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Project</h1>
      <form action={createProject} className="flex flex-col gap-4">
        <input name="title" placeholder="Title" required className="border p-2 rounded" />
        <input name="slug" placeholder="Slug" required className="border p-2 rounded" />
        <textarea name="description" placeholder="Description" required className="border p-2 rounded" />
        <input name="imageUrl" placeholder="Image URL" required className="border p-2 rounded" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Create Project
        </button>
      </form>
    </div>
  );
}
