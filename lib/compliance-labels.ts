// Human-readable Finnish labels for compliance rule codes that can reach the
// dashboard. Internal rule identifiers (e.g. GPSR_PRODUCT_NAME) must never be
// shown to customers. Unknown codes fall back to a safe generic label.
// Source of truth for the codes: the Worker's regulation_rules seed.

export const RULE_LABELS: Record<string, string> = {
  // GPSR — always applied
  GPSR_PRODUCT_NAME: 'Tuotteen nimi on ilmoitettu',
  GPSR_MANUFACTURER_NAME: 'Valmistajan nimi on ilmoitettu',
  GPSR_MANUFACTURER_ADDRESS: 'Valmistajan osoite on ilmoitettu',
  GPSR_MANUFACTURER_CONTACT: 'Valmistajan yhteystiedot on ilmoitettu',
  GPSR_SAFETY_NOTES: 'Turvallisuustiedot on annettu',
  GPSR_CE_MARKING_INFO: 'CE-merkintää koskevat tiedot',
  // Textiles
  ESPR_TEXTILES_MATERIALS: 'Materiaalit on ilmoitettu',
  ESPR_TEXTILES_CARE: 'Hoito-ohjeet on annettu',
  ESPR_TEXTILES_RECYCLING: 'Kierrätysohjeet on annettu',
  TEXT_LABEL_FIBER_COMP: 'Materiaalikoostumus on ilmoitettu',
  TEXT_LABEL_CARE: 'Hoito-ohjeet on annettu',
  TEXT_REACH_SUBSTANCES: 'Aineita koskevat tiedot on annettu',
  TEXT_REACH_AZO_DOC: 'Väriaineita koskeva dokumentaatio',
  TEXT_ESPR_RECYCLED_CONTENT: 'Kierrätysmateriaalin osuus',
  // Jewelry
  JEWEL_REACH_SUBSTANCES: 'Aineita koskevat tiedot on annettu',
  JEWEL_REACH_NICKEL_DOC: 'Nikkeliä koskeva dokumentaatio',
  JEWEL_REACH_CADMIUM_DOC: 'Kadmiumia koskeva dokumentaatio',
  JEWEL_GPSR_ALLERGEN_WARNING: 'Allergeenivaroitus on annettu',
  JEWEL_MATERIALS_DECLARATION: 'Materiaalit on ilmoitettu',
  // Electronics
  ESPR_ELECTRONICS: 'Elektroniikan ESPR-tiedot',
  ELEC_REACH_SVHC: 'Erityistä huolta aiheuttavat aineet on ilmoitettu',
  ELEC_ROHS_SUBSTANCES: 'RoHS-aineita koskevat tiedot',
  ELEC_ROHS_EU_DOC: 'RoHS-vaatimustenmukaisuusasiakirja',
  ELEC_CE_EU_DOC: 'CE-vaatimustenmukaisuusasiakirja',
  ELEC_WEEE_RECYCLING: 'Sähkölaitteiden kierrätystiedot',
  ELEC_WEEE_SYMBOL_DOC: 'WEEE-merkintää koskeva asiakirja',
  ELEC_ESPR_REPAIR_INFO: 'Korjaustiedot on annettu',
  // Batteries
  BAT_REACH_SVHC: 'Erityistä huolta aiheuttavat aineet on ilmoitettu',
  BAT_REG_SUBSTANCES: 'Akun aineita koskevat tiedot',
  BAT_REG_CHEMISTRY: 'Akkukemian tiedot on annettu',
  BAT_REG_CARBON_FOOTPRINT: 'Hiilijalanjälkitiedot',
  BAT_REG_RECYCLING_INFO: 'Akun kierrätystiedot',
  BAT_REG_SAFETY_WARNINGS: 'Akun turvallisuusvaroitukset',
  BAT_REG_EU_DOC: 'Akkua koskeva vaatimustenmukaisuusasiakirja',
  // Furniture
  FURN_MATERIALS_DECLARATION: 'Materiaalit on ilmoitettu',
  FURN_ESPR_MATERIALS: 'Materiaalitiedot on annettu',
  ESPR_FURNITURE: 'Huonekalujen ESPR-tiedot',
  FURN_GPSR_SAFETY_INFO: 'Turvallisuustiedot on annettu',
  FURN_REACH_SUBSTANCES: 'Aineita koskevat tiedot on annettu',
  FURN_REACH_FORMALDEHYDE_DOC: 'Formaldehydiä koskeva dokumentaatio',
  FURN_FIRE_SAFETY_DOC: 'Paloturvallisuusasiakirja',
  FURN_ESPR_REPAIR_INFO: 'Korjaustiedot on annettu',
  FURN_EUDR_TIMBER_DOC: 'Puun alkuperää koskeva asiakirja',
};

// Human label for a passed check. Never leaks the raw code.
export function ruleLabel(code: string): string {
  return RULE_LABELS[code] ?? 'Tarkistus täyttyy';
}

// Short action-oriented title for a warning/missing item (presentation only).
export function ruleActionTitle(code: string): string {
  return RULE_LABELS[code] ? `Tarkista: ${RULE_LABELS[code]}` : 'Tarkistettava kohta';
}

// Contextual score label. Presentation only — does NOT change backend status.
// status is the engine's 'complete' | 'incomplete'; score is 0–100.
export function scoreLabel(score: number, status: string): string {
  if (status === 'complete' && score >= 90) return 'Hyvällä tasolla';
  if (score >= 60) return 'Täydennettävää';
  return 'Tarkistettavaa';
}

// Readable Finnish names for regulation codes (the API returns English names).
// Presentation only — does not change which regulations apply.
export const REGULATION_LABELS: Record<string, string> = {
  GPSR: 'Yleinen tuoteturvallisuusasetus (GPSR)',
  REACH: 'Kemikaaleja koskeva REACH-asetus',
  ROHS: 'Vaarallisten aineiden rajoitus elektroniikassa (RoHS)',
  WEEE: 'Sähkö- ja elektroniikkaromun direktiivi (WEEE)',
  TEXTILE_LABELING: 'Tekstiilien kuitunimityksiä ja merkintöjä koskeva asetus',
  ESPR_TEXTILES: 'Ekologisen suunnittelun asetus – tekstiilit (ESPR)',
  ESPR_ELECTRONICS: 'Ekologisen suunnittelun asetus – elektroniikka (ESPR)',
  ESPR_FURNITURE: 'Ekologisen suunnittelun asetus – huonekalut (ESPR)',
  BATTERY_REG: 'EU:n akkuasetus',
  EPR: 'Tuottajavastuu (EPR)',
  EUDR: 'EU:n metsäkatoasetus (EUDR)',
  CE: 'CE-merkintää koskevat vaatimukset',
};

// Finnish label for a regulation; falls back to the API's (English) name, then the code.
export function regulationLabel(code: string, name?: string): string {
  return REGULATION_LABELS[code] ?? name ?? code;
}
