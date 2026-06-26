import { ProjectsView } from "@/components/projects/projects-view"

export default function ClientesProjectsPage() {
  return (
    <ProjectsView
      workspace="freelancer"
      title="Projetos de clientes"
      description="Prospecção e contratados"
      showDealFilter
    />
  )
}
