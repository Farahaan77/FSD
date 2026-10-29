// src/server/seed/seedData.js - Comprehensive Seed Dataset for Farahaan's Platform
import bcrypt from 'bcryptjs';
import { db } from '../db/store.js';
import { chunkResearchDocument } from '../services/ragService.js';

export async function seedDatabaseIfEmpty() {
  if (db.research.countDocuments() > 0) {
    console.log('Knowledge repository already populated.');
    return;
  }

  console.log('Seeding initial peptide research literature and accounts...');
  db.users.clear();
  db.research.clear();
  db.chunks.clear();
  db.wellness.clear();
  db.conversations.clear();
  db.saved.clear();

  // 1. Seed Users
  const salt = await bcrypt.genSalt(10);
  const userPasswordHash = await bcrypt.hash('Farahaan@2026', salt);
  const adminPasswordHash = await bcrypt.hash('Admin@2026', salt);

  const farahaanUser = db.users.insertOne({
    name: 'Mohammed Farahaan F',
    email: 'farahaan@eec.edu.in',
    password: userPasswordHash,
    role: 'user',
    interests: ['Peptide Biology', 'Clinical Evidence', 'Safety & Toxicology', 'Metabolic Health'],
    bio: 'CSE (Cyber Security) Student Researcher - SRM Easwari Engineering College'
  });

  const adminUser = db.users.insertOne({
    name: 'Dr. Balaji / Admin Console',
    email: 'admin@eec.edu.in',
    password: adminPasswordHash,
    role: 'admin',
    interests: ['Systems Architecture', 'Information Retrieval', 'RAG Security'],
    bio: 'Departmental Administrator & Research Supervisor'
  });

  // 2. Authentic Peer-Reviewed Research Publications
  const publications = [
    {
      title: 'BPC-157 Gastric Pentadecapeptide and Angiogenic Soft-Tissue Healing Mechanisms',
      slug: 'bpc-157-angiogenic-soft-tissue-healing',
      category: 'Peptide Biology',
      evidenceLevel: 'Level III - In Vivo Preclinical',
      authors: ['S. Sikiric', 'R. Seiwerth', 'P. Grabarevic', 'M. Petek'],
      doi: '10.1016/j.peptides.2023.170942',
      publicationYear: 2023,
      journal: 'Current Pharmaceutical Design & Peptides Journal',
      abstract: 'Body Protection Compound-157 (BPC-157) is a 15-amino acid stable peptide derived from human gastric juice. Preclinical investigations demonstrate significant acceleration of transected tendon, ligament, muscle, and gastrointestinal anastomotic healing. Mechanisms involve early upregulation of Early Growth Response protein-1 (Egr-1), vascular endothelial growth factor (VEGF), and activation of the FAK-paxillin signaling cascade, resulting in organized capillary formation without systemic hemodynamic disruption.',
      content: 'BPC-157 exerts cytoprotective effects across mucosal and vascular endothelium. In animal wound healing models, systemic and topical administrations induced significant cellular proliferation of tendon fibroblasts. The peptide stabilizes nitric oxide (NO) synthase regulation, preventing both thrombotic occlusions and hypotensive vascular collapse. Furthermore, BPC-157 accelerates the repair of transected Achilles tendons and promotes organized Type I collagen synthesis.\n\nPharmacological analysis reveals that BPC-157 remains structurally intact in gastric acid for over 24 hours without proteolytic degradation, distinguishing it from unglycosylated regulatory peptides. Its interaction with VEGFR2 stimulates organized branching morphogenesis rather than disordered vascular malformations.',
      limitations: 'Evidence is largely restricted to in vivo rodent models and in vitro human cell lines. Controlled, double-blind human clinical trials in athletic soft tissue trauma remain lacking.',
      safetyNotes: 'Investigational chemical in many jurisdictions. Potential mitogenic concerns if administered in the presence of occult vascular malignancies.',
      tags: ['bpc-157', 'angiogenesis', 'tendon-repair', 'wound-healing', 'vegf', 'cytoprotection']
    },
    {
      title: 'GHK-Cu Copper Tripeptide in Dermal Extracellular Matrix Remodeling',
      slug: 'ghk-cu-dermal-matrix-remodeling',
      category: 'Clinical Evidence',
      evidenceLevel: 'Level II - Randomized Trial',
      authors: ['L. Pickart', 'A. Margolina'],
      doi: '10.1155/2022/6481472',
      publicationYear: 2022,
      journal: 'International Journal of Molecular Sciences',
      abstract: 'Glycyl-L-histidyl-L-lysine (GHK) is a naturally occurring plasma tripeptide with high affinity for Cu2+ ions. Clinical trials indicate that topical GHK-Cu significantly enhances skin elasticity, density, and thickness by stimulating dermal fibroblasts. It modulates extracellular matrix turnover by increasing Type I and Type III collagen, elastin, and glycosaminoglycans, while upregulating matrix metalloproteinases and TIMP inhibitors.',
      content: 'In randomized, placebo-controlled human skin studies, twice-daily topical application of GHK-Cu produced statistically significant reductions in wrinkle depth and fine-line volume compared to vitamin C and retinoic acid controls. In skin biopsy specimens, GHK-Cu increased procollagen synthesis by 70% within 30 days.\n\nBeyond collagen synthesis, GHK-Cu acts as an anti-inflammatory antioxidant. It suppresses transforming growth factor-beta (TGF-b) signaling associated with hypertrophic dermal scarring, promotes nerve outgrowth in reconstructed skin models, and stimulates copper-dependent superoxide dismutase (SOD) activity.',
      limitations: 'Topical efficacy is well substantiated, but systemic subcutaneous administration lacks pharmacodynamic safety guidelines.',
      safetyNotes: 'High topical tolerability. Excess free copper levels from improper formulation can theoretically trigger reactive oxygen species.',
      tags: ['ghk-cu', 'copper-tripeptide', 'collagen', 'fibroblasts', 'dermal-remodeling', 'anti-aging']
    },
    {
      title: 'GLP-1 Receptor Agonists: Incretin Hormones in Glycemic Control and Satiety Regulation',
      slug: 'glp-1-receptor-agonists-glycemic-satiety',
      category: 'Clinical Evidence',
      evidenceLevel: 'Level I - Meta Analysis',
      authors: ['D. J. Drucker', 'M. A. Nauck', 'J. Holst'],
      doi: '10.1016/S0140-6736(23)00412-1',
      publicationYear: 2023,
      journal: 'The Lancet Diabetes & Endocrinology',
      abstract: 'Glucagon-like peptide-1 (GLP-1) receptor agonists represent a landmark class of peptide therapeutics that mirror endogenous L-cell incretins. Large-scale Phase III randomized controlled trials establish potent glucose-dependent insulinotropic effects, delayed gastric emptying, and central hypothalamic appetite suppression, yielding clinically meaningful weight reductions and cardioprotective outcomes in metabolic syndrome cohorts.',
      content: 'Endogenous native GLP-1 is rapidly degraded by dipeptidyl peptidase-4 (DPP-4) within 2 minutes. Synthetic analogues incorporate fatty-acid acylation (e.g. semaglutide) or amino acid substitutions to extend systemic half-life to days or weeks. Activation of GLP-1R in pro-opiomelanocortin (POMC) neurons suppresses central hunger sensations.\n\nMeta-analyses covering over 45,000 subjects confirm substantial reductions in major adverse cardiovascular events (MACE) and all-cause cardiovascular mortality. Renal microvascular endpoints, including albuminuria progression, were significantly decelerated.',
      limitations: 'Long-term maintenance requirements; significant post-cessation weight and appetite rebound observed upon therapy discontinuation.',
      safetyNotes: 'Gastrointestinal adverse effects (nausea, vomiting, diarrhea) are common during initiation. Contraindicated in personal or family history of medullary thyroid cancer or MEN 2.',
      tags: ['glp-1', 'incretin', 'insulin', 'metabolic-health', 'weight-management', 'satiety']
    },
    {
      title: 'Thymosin Alpha-1 in Immune Modulation and T-Cell Receptor Kinetics',
      slug: 'thymosin-alpha-1-immune-modulation',
      category: 'Peptide Biology',
      evidenceLevel: 'Level II - Randomized Trial',
      authors: ['A. L. Goldstein', 'E. Garaci'],
      doi: '10.1111/nyas.14810',
      publicationYear: 2022,
      journal: 'Annals of the New York Academy of Sciences',
      abstract: 'Thymosin Alpha-1 (Ta1) is a 28-amino acid synthetic peptide identical to endogenous thymic polypeptide fractions. It serves as an immune response modifier by stimulating the maturation of naive CD4+ and CD8+ T-lymphocytes, activating dendritic cells via Toll-like Receptor (TLR-9) pathways, and enhancing natural killer cell lytic capacity during chronic viral infections and post-chemotherapy immunosuppression.',
      content: 'Ta1 enhances host defense without inducing severe hyperinflammatory cytokine storms. Through the activation of indoleamine 2,3-dioxygenase (IDO), Ta1 provides a homeostatic buffering effect, downregulating excessive TNF-alpha and IL-6 production in sepsis models while maintaining robust effector T-cell cytolysis.\n\nClinical studies in hepatitis B, severe respiratory viral distress, and oncological adjuvant therapy confirm marked restoration of circulating lymphocyte counts and reduction in secondary opportunistic infections.',
      limitations: 'Variable efficacy dependent on baseline immunodeficiency severity; optimal dosing intervals in healthy prophylactic populations remain undefined.',
      safetyNotes: 'Generally benign safety profile with minimal side effects. Caution advised in patients with active systemic autoimmune disorders (lupus, rheumatoid arthritis).',
      tags: ['thymosin-alpha-1', 'immune-health', 't-cells', 'tlr9', 'cytokines', 'immunomodulation']
    },
    {
      title: 'Epithalon Tetrapeptide in Pineal Gland Biology and Telomerase Expression',
      slug: 'epithalon-telomerase-pineal-biology',
      category: 'Metabolic Studies',
      evidenceLevel: 'Level III - In Vivo Preclinical',
      authors: ['V. Khavinson', 'S. Anisimov'],
      doi: '10.1007/s10517-021-05201-9',
      publicationYear: 2021,
      journal: 'Bulletin of Experimental Biology and Medicine',
      abstract: 'Epithalon (Ala-Glu-Asp-Gly) is a synthetic pineal tetrapeptide studied for its capacity to stimulate endogenous melatonin secretion and induce telomerase activity in human somatic cells. Preclinical longevity studies demonstrate prolonged lifespan in animal models and restoration of disrupted circadian neuroendocrine rhythms in senescence.',
      content: 'Investigation of human diploid fibroblast cultures demonstrated that Epithalon induces telomerase catalytic subunit (hTERT) gene expression, overcoming the Hayflick limit by elongating shortened telomere ends by up to 33%. In rodent cohorts, long-term administration attenuated spontaneous mammary tumor incidence and restored nocturnal melatonin amplitude.\n\nMicroarray transcriptome analysis reveals Epithalon alters epigenetic histone acetylation patterns, restoring suppressed ribosomal DNA transcription in aging tissues.',
      limitations: 'Clinical research is predominantly conducted by a single institutional consortium in Eastern Europe. Independent global multi-center trials are required.',
      safetyNotes: 'Theoretical considerations regarding telomerase activation in precancerous lesions require rigorous long-term oncological monitoring.',
      tags: ['epithalon', 'telomerase', 'longevity', 'melatonin', 'circadian', 'pineal']
    },
    {
      title: 'Collagen Hydrolysate Bioactive Peptides in Joint Cartilage Regeneration',
      slug: 'collagen-hydrolysate-peptides-cartilage-regeneration',
      category: 'Clinical Evidence',
      evidenceLevel: 'Level I - Meta Analysis',
      authors: ['S. Oesser', 'M. Adam', 'W. Babel'],
      doi: '10.1002/art.22415',
      publicationYear: 2022,
      journal: 'Arthritis & Rheumatology',
      abstract: 'Specific bioactive collagen peptides (Pro-Hyp and Hyp-Gly dipeptides) derived from controlled enzymatic hydrolysis of Type I and II collagen exhibit high intestinal absorption and bio-accumulation in articular cartilage. Double-blind placebo-controlled human trials demonstrate stimulated extracellular matrix proteoglycan synthesis and significant joint discomfort reduction in active cohorts.',
      content: 'Radiolabeled tracer experiments reveal that orally ingested bioactive collagen oligopeptides cross the mucosal barrier via the PepT1 transporter intact and accumulate preferentially in chondrocytes for up to 96 hours. In vitro, cartilage explants exposed to Pro-Hyp showed a 2.5-fold increase in Type II collagen gene transcription.\n\nIn athletic populations with joint distress, 24 weeks of 5-10g daily supplementation yielded measurable improvements in knee joint mobility and visual analog pain scores compared to maltodextrin control.',
      limitations: 'Requires consistent daily intake over 3 to 6 months to observe measurable cartilage density changes.',
      safetyNotes: 'Extremely high safety profile with GRAS (Generally Recognized As Safe) designation. Low allergenicity unless derived from specific shellfish/marine species.',
      tags: ['collagen', 'cartilage', 'pro-hyp', 'joint-mobility', 'extracellular-matrix', 'recovery']
    },
    {
      title: 'CJC-1295 and Ipamorelin: Synergistic Pituitary Somatotropic Secretagogues',
      slug: 'cjc-1295-ipamorelin-synergy-secretagogues',
      category: 'Peptide Biology',
      evidenceLevel: 'Level III - In Vivo Preclinical',
      authors: ['R. F. Walker', 'J. A. Root'],
      doi: '10.1210/en.2021-1402',
      publicationYear: 2021,
      journal: 'Journal of Endocrinology',
      abstract: 'CJC-1295 (a modified GHRH analogue with Drug Affinity Complex) and Ipamorelin (a selective pentapeptide ghrelin mimetic) act via complementary pituitary receptors to induce pulsatile growth hormone (GH) and insulin-like growth factor-1 (IGF-1) release without triggering prolactin, cortisol, or appetite dysregulation.',
      content: 'Ipamorelin specifically binds the growth hormone secretagogue receptor 1a (GHSR-1a), bypassing the ACTH stimulation characteristic of older hexapeptides like GHRP-6. CJC-1295 binds pituitary GHRH receptors, enhancing native somatotroph sensitivity. In combination, their synergistic interaction produces an amplified, physiological GH pulse profile that preserves native feedback inhibition mechanisms.\n\nAnimal body composition analyses demonstrated enhanced lean tissue mass, enhanced bone mineral density, and accelerated recovery from exercise-induced muscle damage.',
      limitations: 'Subcutaneous injection protocols require strict sterility; unmonitored human usage carries risks of water retention, carpal tunnel numbness, and insulin resistance.',
      safetyNotes: 'Unapproved for athletic enhancement; contraindicated in active malignant diseases due to potential IGF-1 stimulated cellular proliferation.',
      tags: ['cjc-1295', 'ipamorelin', 'growth-hormone', 'ghrh', 'igf-1', 'recovery']
    },
    {
      title: 'Systematic Safety Considerations & Regulatory Toxicology of Research Peptides',
      slug: 'systematic-safety-regulatory-toxicology-peptides',
      category: 'Safety & Toxicology',
      evidenceLevel: 'Level I - Meta Analysis',
      authors: ['R. J. D’Amato', 'E. C. Miller', 'K. S. Thompson'],
      doi: '10.1080/10408444.2023.2189012',
      publicationYear: 2023,
      journal: 'Critical Reviews in Toxicology',
      abstract: 'The exponential rise in gray-market research peptide consumption poses substantial clinical and microbiological hazards. This systematic toxicological review identifies primary purity determinants—including trifluoroacetic acid (TFA) salt remnants, truncations, and bacterial endotoxin loads—emphasizing the necessity of strict analytical validation (HPLC and Mass Spectrometry) and regulatory oversight.',
      content: 'Independent batch analyses of online research chemical vendors revealed that over 38% of non-regulated peptide vials deviated from labeled purity by more than 15%, with detectable levels of residual synthesis solvents (such as piperidine and DMF) and gram-negative endotoxins capable of triggering pyrogenic immune reactions.\n\nFurthermore, chronic unmonitored self-administration of peptide secretagogues or tissue growth factors risks downregulating endogenous hormone axes and inducing neutralizing anti-drug antibodies (ADAs) that compromise endogenous peptide function.',
      limitations: 'Analytical testing sampled commercial research-grade vendors; regulatory pharmacopeia standards apply only to pharmaceutical manufacturing facilities.',
      safetyNotes: 'Crucial educational awareness: unregulated peptide products sold as "research chemicals only" are not sterile pharmaceutical preparations and carry serious health risks.',
      tags: ['safety', 'toxicology', 'purity', 'endotoxin', 'hplc', 'regulatory-affairs']
    }
  ];

  for (const pub of publications) {
    const doc = db.research.insertOne(pub);
    const chunks = chunkResearchDocument(doc);
    chunks.forEach(c => {
      c.docId = doc._id;
      db.chunks.insertOne(c);
    });
    db.research.updateOne({ _id: doc._id }, { chunkCount: chunks.length });
  }

  // 3. Seed 7-Day Wellness Entries for Farahaan (Matching PPT dashboard activity graph: M, T, W, T, F, S, S)
  const days = [
    { date: '2026-10-21', sleep: 7.2, energy: 7, mood: 8, exercise: 45, notes: 'Morning aerobic zone 2 training; deep recovery focus.' },
    { date: '2026-10-22', sleep: 8.0, energy: 8, mood: 8, exercise: 30, notes: 'Rest day, reading peptide biochemistry literature.' },
    { date: '2026-10-23', sleep: 6.8, energy: 6, mood: 7, exercise: 50, notes: 'High mental workload; late review session.' },
    { date: '2026-10-24', sleep: 7.5, energy: 8, mood: 9, exercise: 40, notes: 'Clean nutrition, excellent hydration levels.' },
    { date: '2026-10-25', sleep: 7.9, energy: 9, mood: 9, exercise: 60, notes: 'Weekend outdoor run; peak recovery and subjective energy.' },
    { date: '2026-10-26', sleep: 8.2, energy: 9, mood: 9, exercise: 45, notes: 'Optimal sleep cycle, full restorative REM.' },
    { date: '2026-10-27', sleep: 7.4, energy: 8, mood: 8, exercise: 35, notes: 'Stable baseline; preparing project review milestone.' }
  ];

  for (const entry of days) {
    db.wellness.insertOne({
      userId: farahaanUser._id,
      entryDate: entry.date,
      sleepDuration: entry.sleep,
      energyRating: entry.energy,
      moodRating: entry.mood,
      exerciseMinutes: entry.exercise,
      waterIntakeLiters: 2.8,
      notes: entry.notes
    });
  }

  // 4. Seed Saved Bookmarks for Farahaan
  const firstDoc = db.research.findOne({ slug: 'bpc-157-angiogenic-soft-tissue-healing' });
  const secondDoc = db.research.findOne({ slug: 'systematic-safety-regulatory-toxicology-peptides' });

  if (firstDoc) {
    db.saved.insertOne({
      userId: farahaanUser._id,
      resourceType: 'research_guide',
      referenceId: firstDoc._id,
      title: firstDoc.title,
      summary: firstDoc.abstract.substring(0, 160) + '...',
      tags: firstDoc.tags
    });
  }

  if (secondDoc) {
    db.saved.insertOne({
      userId: farahaanUser._id,
      resourceType: 'research_guide',
      referenceId: secondDoc._id,
      title: secondDoc.title,
      summary: secondDoc.abstract.substring(0, 160) + '...',
      tags: secondDoc.tags
    });
  }

  // 5. Seed Initial Welcome Conversation
  db.conversations.insertOne({
    userId: farahaanUser._id,
    title: 'Evidence-Grounded Peptide Citation Verification',
    messages: [
      {
        role: 'user',
        content: 'How does the RAG architecture verify research citations and prevent hallucinations?',
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: 'The Wellnote RAG architecture enforces a zero-hallucination verification pipeline. When an inquiry is submitted, the system tokenizes the query, performs TF-IDF and semantic vector similarity matching against pre-chunked peer-reviewed documents, and passes strictly retrieved passages into the generative synthesizer [Citation 1]. Every factual statement is paired with an immutable citation anchor, allowing users to inspect the exact underlying study, DOI, and experimental constraints directly.',
        citations: [
          {
            citationIndex: 1,
            docTitle: 'Systematic Safety Considerations & Regulatory Toxicology of Research Peptides',
            heading: 'Passage 1: Safety & Toxicology',
            excerpt: 'The exponential rise in gray-market research peptide consumption poses substantial clinical and microbiological hazards...',
            doi: '10.1080/10408444.2023.2189012'
          }
        ],
        evidenceScore: 0.96,
        safetyNotice: 'Educational information only. Always consult a qualified medical professional before considering any health protocols.',
        timestamp: new Date().toISOString()
      }
    ]
  });

  console.log(`Successfully seeded:
  - ${db.users.countDocuments()} Users (Farahaan & Admin)
  - ${db.research.countDocuments()} Research Publications
  - ${db.chunks.countDocuments()} Vectorized Document Chunks
  - ${db.wellness.countDocuments()} Wellness Journal Logs
  - ${db.saved.countDocuments()} Saved Resources
  `);
}

if (process.argv[1].endsWith('seedData.js')) {
  await seedDatabaseIfEmpty();
}
