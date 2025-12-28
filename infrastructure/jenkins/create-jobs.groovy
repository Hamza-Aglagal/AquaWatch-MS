import jenkins.model.*
import hudson.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.GitSCM
import hudson.plugins.git.BranchSpec

def jenkins = Jenkins.getInstance()

// Liste des services à créer
def services = [
    [name: 'service_capteurs', description: 'Service de gestion des capteurs IoT (Node.js)'],
    [name: 'service_alertes', description: 'Service de gestion des alertes (Node.js)'],
    [name: 'service_api_sig', description: 'Service API-SIG avec interface Next.js (TypeScript)'],
    [name: 'service_satellite', description: 'Service de traitement des données satellite (Python)'],
    [name: 'service_stmodel', description: 'Service de modélisation spatio-temporelle (Python)']
]

println "🚀 Création des jobs Jenkins pour AquaWatch-MS..."
println "=" * 60

services.each { service ->
    def jobName = service.name
    def jobDescription = service.description
    
    println "\n📦 Création du job: ${jobName}"
    
    // Vérifier si le job existe déjà
    def job = jenkins.getItem(jobName)
    
    if (job != null) {
        println "   ⚠️  Le job ${jobName} existe déjà, il sera recréé"
        job.delete()
    }
    
    // Créer un nouveau Pipeline Job
    def newJob = jenkins.createProject(WorkflowJob, jobName)
    newJob.setDescription(jobDescription)
    
    // Configuration du pipeline depuis le Jenkinsfile dans le repo
    def scm = new GitSCM("file:///workspace")
    scm.branches = [new BranchSpec("*/main"), new BranchSpec("*/master")]
    
    def definition = new CpsScmFlowDefinition(scm, "services/${jobName}/Jenkinsfile")
    definition.setLightweight(true)
    
    newJob.setDefinition(definition)
    newJob.save()
    
    println "   ✅ Job ${jobName} créé avec succès"
}

// Créer le job global
println "\n📦 Création du job global: AquaWatch-MS-Global"
def globalJob = jenkins.getItem("AquaWatch-MS-Global")

if (globalJob != null) {
    println "   ⚠️  Le job AquaWatch-MS-Global existe déjà, il sera recréé"
    globalJob.delete()
}

def newGlobalJob = jenkins.createProject(WorkflowJob, "AquaWatch-MS-Global")
newGlobalJob.setDescription("Pipeline global pour orchestrer tous les microservices AquaWatch-MS")

def globalScm = new GitSCM("file:///workspace")
globalScm.branches = [new BranchSpec("*/main"), new BranchSpec("*/master")]

def globalDefinition = new CpsScmFlowDefinition(globalScm, "Jenkinsfile")
globalDefinition.setLightweight(true)

newGlobalJob.setDefinition(globalDefinition)
newGlobalJob.save()

println "   ✅ Job AquaWatch-MS-Global créé avec succès"

println "\n" + "=" * 60
println "✨ Tous les jobs ont été créés avec succès !"
println "=" * 60
println "\n📋 Jobs créés:"
services.each { service ->
    println "   • ${service.name}"
}
println "   • AquaWatch-MS-Global (pipeline global)"
println "\n🌐 Accédez à Jenkins: http://localhost:8080"
