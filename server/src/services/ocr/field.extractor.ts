import { ExtractedFieldItem } from './ocr.interface';

export class LandFieldExtractor {
  /**
   * Performs lexical analysis on OCR raw text to extract structured land record fields.
   */
  static extractFields(rawText: string, baseConfidence: number = 0.85): ExtractedFieldItem[] {
    const fields: ExtractedFieldItem[] = [];

    if (!rawText || rawText.trim().length === 0) {
      return fields;
    }

    // 1. Khasra / Survey Number
    const khasraMatch = rawText.match(
      /(?:Khasra|Survey|Plot|खसरा|सर्वे)\s*(?:No\.?|Number|नं\.?|नंबर)?[:\s-]*([0-9]+(?:\/[0-9]+)?)/i
    );
    if (khasraMatch && khasraMatch[1]) {
      fields.push({
        fieldName: 'khasraNumber',
        fieldValue: khasraMatch[1].trim(),
        confidence: Math.min(1.0, baseConfidence + 0.05),
      });
    }

    // 2. Khatauni / Account Number
    const khatauniMatch = rawText.match(
      /(?:Khatauni|Khatiyan|Account|खतौनी|खाता)\s*(?:No\.?|Number|नं\.?|नंबर)?[:\s-]*([0-9A-Za-z/-]+)/i
    );
    if (khatauniMatch && khatauniMatch[1]) {
      fields.push({
        fieldName: 'khatauniNumber',
        fieldValue: khatauniMatch[1].trim(),
        confidence: Math.min(1.0, baseConfidence + 0.03),
      });
    }

    // 3. District
    const districtMatch = rawText.match(
      /(?:District|Dist\.?|जिला)[:\s-]*([A-Za-z\u0900-\u097F]+)/i
    );
    if (districtMatch && districtMatch[1]) {
      fields.push({
        fieldName: 'district',
        fieldValue: districtMatch[1].trim(),
        confidence: baseConfidence,
      });
    }

    // 4. Tehsil / Sub-District
    const tehsilMatch = rawText.match(
      /(?:Tehsil|Taluka|तहसील|तालुका)[:\s-]*([A-Za-z\u0900-\u097F]+)/i
    );
    if (tehsilMatch && tehsilMatch[1]) {
      fields.push({
        fieldName: 'tehsil',
        fieldValue: tehsilMatch[1].trim(),
        confidence: baseConfidence,
      });
    }

    // 5. Village / Mouza
    const villageMatch = rawText.match(
      /(?:Village|Gram|Mouza|ग्राम|गाँव|मौजा)[:\s-]*([A-Za-z\u0900-\u097F]+)/i
    );
    if (villageMatch && villageMatch[1]) {
      fields.push({
        fieldName: 'village',
        fieldValue: villageMatch[1].trim(),
        confidence: baseConfidence,
      });
    }

    // 6. Registered Area
    const areaMatch = rawText.match(
      /(?:Area|Rakba|क्षेत्रफल|रकबा)[:\s-]*([0-9,.]+)\s*(sq\.?\s*m(?:eters?)?|hectares?|acres?|bigha|हेक्टेयर|बीघा)?/i
    );
    if (areaMatch && areaMatch[1]) {
      const numericArea = parseFloat(areaMatch[1].replace(/,/g, ''));
      if (!isNaN(numericArea)) {
        fields.push({
          fieldName: 'areaInSqMeters',
          fieldValue: String(numericArea),
          confidence: Math.min(1.0, baseConfidence + 0.02),
        });
      }
    }

    // 7. Owner / Titleholder Name
    const ownerMatch = rawText.match(
      /(?:Owner|Applicant|Holder|खातेदार|मालिक|विक्रेता|क्रेता)[:\s-]*([A-Za-z\s\u0900-\u097F]+?)(?:\s*(?:S\/O|D\/O|W\/O|आत्मज|पुत्र|पत्नी|Share|Area|\n|$))/i
    );
    if (ownerMatch && ownerMatch[1] && ownerMatch[1].trim().length > 2) {
      fields.push({
        fieldName: 'owners',
        fieldValue: ownerMatch[1].trim(),
        confidence: Math.min(1.0, baseConfidence),
      });
    }

    return fields;
  }
}
