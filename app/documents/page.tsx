import { DocumentVault } from "@/components/nyaya/document-vault"
import { SiteHeader } from "@/components/nyaya/site-header"
import { SiteFooter } from "@/components/nyaya/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, HardDrive, Filter } from "lucide-react"

export default function GlobalDocumentsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/20">
        <div className="container py-10">
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Global Evidence Vault</h1>
            <p className="text-muted-foreground text-lg">
              Manage and analyze all your legal documents across all cases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <HardDrive className="h-4 w-4" /> Total Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">24</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Processed & Analyzed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">22</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Auto-Categorized
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">100%</div>
              </CardContent>
            </Card>
          </div>

          <DocumentVault />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
