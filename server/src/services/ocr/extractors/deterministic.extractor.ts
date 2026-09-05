import {
  FieldExtractionItem,
  IFieldExtractionProvider,
  StructuredLandRecordResult,
} from './extractor.interface.js';

export class DeterministicFieldExtractor implements IFieldExtractionProvider {
  public readonly providerName = 'deterministic-rule-engine' as const;

  /**
   * Deterministically extracts 12 target land record fields from raw OCR text
   * using multilingual bilingual (English & Hindi) regular expressions and heuristics.
   * Never invents information; missing values are explicitly marked.
   */
  public async extractFields(ocrText: string): Promise<StructuredLandRecordResult> {
    const rawOcr = ocrText || '';
    const lines = rawOcr
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const fields: Record<string, FieldExtractionItem> = {
      owner: this.extractOwner(rawOcr, lines),
      coOwner: this.extractCoOwner(rawOcr, lines),
      khasraNumber: this.extractKhasraNumber(rawOcr, lines),
      plotNumber: this.extractPlotNumber(rawOcr, lines),
      area: this.extractArea(rawOcr, lines),
      village: this.extractVillage(rawOcr, lines),
      tehsil: this.extractTehsil(rawOcr, lines),
      district: this.extractDistrict(rawOcr, lines),
      state: this.extractState(rawOcr, lines),
      landType: this.extractLandType(rawOcr, lines),
      registrationDate: this.extractRegistrationDate(rawOcr, lines),
      documentNumber: this.extractDocumentNumber(rawOcr, lines),
    };

    const fieldList = Object.values(fields);
    const totalFieldsCount = fieldList.length;
    const extractedFieldsCount = fieldList.filter((f) => !f.isMissing).length;
    const uncertainFieldsCount = fieldList.filter((f) => f.isUncertain).length;
    const missingFieldsCount = fieldList.filter((f) => f.isMissing).length;

    const validConfidenceSum = fieldList
      .filter((f) => !f.isMissing)
      .reduce((sum, f) => sum + f.confidence, 0);

    const overallConfidence =
      extractedFieldsCount > 0
        ? Number((validConfidenceSum / extractedFieldsCount).toFixed(2))
        : 0.0;

    return {
      provider: this.providerName,
      extractedAt: new Date().toISOString(),
      overallConfidence,
      totalFieldsCount,
      extractedFieldsCount,
      uncertainFieldsCount,
      missingFieldsCount,
      rawOcrLength: rawOcr.length,
      fields,
      fieldList,
    };
  }

  // --- 1. Owner ---
  private extractOwner(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Primary\s*Owner\s*Name|Owner\s*Name|Primary\s*Owner|Khatedar|Pattedar|Name\s*of\s*Owner|खातेदार|भूस्वामी|मालिक\s*का\s*नाम)[\s:：\-—]+([A-Za-z\u0900-\u097F\s.]{3,60})/i,
      /(?:Name\s*of\s*Holder|Recorded\s*Owner|Landowner)[\s:：\-—]+([A-Za-z\u0900-\u097F\s.]{3,60})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = this.cleanName(match[1]);
          if (val.length >= 3 && !this.isLabelNoise(val)) {
            return this.buildItem('owner', 'Primary Owner', val, 0.94, line, false);
          }
        }
      }
    }

    // Secondary scan across raw text
    for (const regex of regexes) {
      const match = raw.match(regex);
      if (match && match[1]) {
        const val = this.cleanName(match[1]);
        if (val.length >= 3 && !this.isLabelNoise(val)) {
          return this.buildItem('owner', 'Primary Owner', val, 0.88, match[0], false);
        }
      }
    }

    return this.buildMissing('owner', 'Primary Owner');
  }

  // --- 2. Co-Owner ---
  private extractCoOwner(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Co-?Owner|Joint\s*Owner|Secondary\s*Owner|सह-?खातेदार|सह-?हिस्सेदार|सहस्वामी)[\s:：\-—]+([A-Za-z\u0900-\u097F0-9\s.,/%()\-]{3,80})/i,
      /(?:Co-?Sharer|Other\s*Owner)[\s:：\-—]+([A-Za-z\u0900-\u097F0-9\s.,/%()\-]{3,80})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = this.cleanValue(match[1]);
          if (val.length >= 2 && !this.isLabelNoise(val) && !/^(none|nil|n\/a|लागू नहीं)$/i.test(val)) {
            return this.buildItem('coOwner', 'Co-Owner / Joint Sharer', val, 0.9, line, false);
          } else if (/^(none|nil|n\/a|लागू नहीं)$/i.test(val)) {
            return this.buildItem('coOwner', 'Co-Owner / Joint Sharer', 'None', 0.95, line, false);
          }
        }
      }
    }

    return this.buildMissing('coOwner', 'Co-Owner / Joint Sharer');
  }

  // --- 3. Khasra / Survey Number ---
  private extractKhasraNumber(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Khasra(?:\s*No|\s*Number)?|Survey(?:\s*No|\s*Number)?|Gat(?:\s*No)?|खसरा\s*(?:नं|संख्या|नम्बर)?)[\s:：\-—]+([0-9]{1,5}(?:[\/,\-][0-9]{1,5})*(?:\s*(?:min|part|[a-zA-Z]))?)/i,
      /(?:Khasra|Survey|खसरा)[\s#№:：\-—]+([0-9]{1,5}(?:[\/,\-][0-9]{1,5})*)/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (val.length > 0) {
            return this.buildItem('khasraNumber', 'Khasra / Survey Number', val, 0.95, line, false);
          }
        }
      }
    }

    // Fallback: look for patterns like "142/1" or "205/3/1"
    const standaloneMatch = raw.match(/\b([0-9]{2,4}\/[0-9]{1,3}(?:\/[0-9]{1,2})?)\b/);
    if (standaloneMatch && standaloneMatch[1]) {
      return this.buildItem(
        'khasraNumber',
        'Khasra / Survey Number',
        standaloneMatch[1],
        0.7,
        standaloneMatch[0],
        true,
        'Found via loose fractional pattern'
      );
    }

    return this.buildMissing('khasraNumber', 'Khasra / Survey Number');
  }

  // --- 4. Plot Number ---
  private extractPlotNumber(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Plot(?:\s*No|\s*Number)?|भूखंड\s*(?:नं|संख्या|नम्बर)?|प्लॉट\s*(?:नं|संख्या)?)[\s:：\-—]+([A-Za-z0-9\-\/]{1,20})/i,
      /(?:Site(?:\s*No|\s*Number)?|CTS\s*No)[\s:：\-—]+([A-Za-z0-9\-\/]{1,20})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (val.length > 0 && !this.isLabelNoise(val)) {
            return this.buildItem('plotNumber', 'Plot / Site Number', val, 0.92, line, false);
          }
        }
      }
    }

    return this.buildMissing('plotNumber', 'Plot / Site Number');
  }

  // --- 5. Area ---
  private extractArea(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Total\s*Area|Area\s*Covered|Area|क्षेत्रफल|रकबा)[\s:：\-—]+([0-9.,]+\s*(?:Hectares?|Acres?|Sq\.?\s*(?:Meters?|Metres?|Yards?|Feet|Ft)|Bigha|Biswa|Guntha|हेक्टेयर|एकड़|वर्ग\s*मीटर|बीघा|बिस्वा))/i,
      /([0-9]+(?:\.[0-9]+)?)\s*(?:Hectares?|Acres?|Sq\.?\s*Meters?|Bigha|Guntha|हेक्टेयर|एकड़|वर्ग\s*मीटर)/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          return this.buildItem('area', 'Land Area', val, 0.92, line, false);
        }
      }
    }

    // Raw scan fallback
    for (const regex of regexes) {
      const match = raw.match(regex);
      if (match && match[1]) {
        return this.buildItem('area', 'Land Area', match[1].trim(), 0.85, match[0], false);
      }
    }

    return this.buildMissing('area', 'Land Area');
  }

  // --- 6. Village ---
  private extractVillage(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Village|Mauza|Gram|ग्राम|गाँव|मौजा)[\s:：\-—]+([A-Za-z\u0900-\u097F\s]{2,40})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = this.cleanValue(match[1]);
          if (val.length >= 2 && !this.isLabelNoise(val)) {
            return this.buildItem('village', 'Village / Mauza', val, 0.93, line, false);
          }
        }
      }
    }

    return this.buildMissing('village', 'Village / Mauza');
  }

  // --- 7. Tehsil ---
  private extractTehsil(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Tehsil|Taluk|Tahsil|Mandal|तहसील|तालुका|मण्डल)[\s:：\-—]+([A-Za-z\u0900-\u097F\s]{2,40})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = this.cleanValue(match[1]);
          if (val.length >= 2 && !this.isLabelNoise(val)) {
            return this.buildItem('tehsil', 'Tehsil / Taluk', val, 0.93, line, false);
          }
        }
      }
    }

    return this.buildMissing('tehsil', 'Tehsil / Taluk');
  }

  // --- 8. District ---
  private extractDistrict(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:District|Dist\.?|Zila|जिला|ज़िला)[\s:：\-—]+([A-Za-z\u0900-\u097F\s]{2,40})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = this.cleanValue(match[1]);
          if (val.length >= 2 && !this.isLabelNoise(val)) {
            return this.buildItem('district', 'District', val, 0.94, line, false);
          }
        }
      }
    }

    return this.buildMissing('district', 'District');
  }

  // --- 9. State ---
  private extractState(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:State|Province|राज्य)[\s:：\-—]+([A-Za-z\u0900-\u097F\s]{2,40})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = this.cleanValue(match[1]);
          if (val.length >= 2 && !this.isLabelNoise(val)) {
            return this.buildItem('state', 'State', val, 0.95, line, false);
          }
        }
      }
    }

    // Common Indian state mentions scan
    const indianStates = [
      'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan',
      'Gujarat', 'Karnataka', 'Haryana', 'Punjab', 'Bihar', 'West Bengal',
      'Tamil Nadu', 'Telangana', 'Andhra Pradesh', 'Kerala', 'Odisha',
      'उत्तर प्रदेश', 'मध्य प्रदेश', 'महाराष्ट्र', 'राजस्थान', 'गुजरात', 'हरियाणा', 'पंजाब'
    ];

    for (const state of indianStates) {
      const stateRegex = new RegExp(`\\b${state}\\b`, 'i');
      if (stateRegex.test(raw)) {
        return this.buildItem('state', 'State', state, 0.88, `Mentioned in text: ${state}`, false);
      }
    }

    return this.buildMissing('state', 'State');
  }

  // --- 10. Land Type ---
  private extractLandType(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Land\s*Type|Type\s*of\s*Land|Classification|Land\s*Use|भूमि\s*का\s*प्रकार|किस्म\s*जमीन)[\s:：\-—]+([A-Za-z\u0900-\u097F\s\-\/]{3,30})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = this.cleanValue(match[1]);
          if (val.length >= 3 && !this.isLabelNoise(val)) {
            return this.buildItem('landType', 'Land Type / Classification', val, 0.91, line, false);
          }
        }
      }
    }

    // Keywords scan
    if (/Agricultural|Krishi|कृषि|सिंचित|असिंचित/i.test(raw)) {
      return this.buildItem('landType', 'Land Type / Classification', 'Agricultural (कृषि)', 0.85, 'Detected via category keyword', false);
    }
    if (/Residential|Abadi|आवासीय|आबादी/i.test(raw)) {
      return this.buildItem('landType', 'Land Type / Classification', 'Residential (आवासीय)', 0.85, 'Detected via category keyword', false);
    }
    if (/Commercial|व्यावसायिक|औद्योगिक|Industrial/i.test(raw)) {
      return this.buildItem('landType', 'Land Type / Classification', 'Commercial (व्यावसायिक)', 0.85, 'Detected via category keyword', false);
    }

    return this.buildMissing('landType', 'Land Type / Classification');
  }

  // --- 11. Registration Date ---
  private extractRegistrationDate(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Registration\s*Date|Reg\.?\s*Date|Date\s*of\s*Registration|Sanction\s*Date|पंजीकरण\s*(?:दिनांक|तारीख)|दिनांक)[\s:：\-—]+([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
      /(?:Dated|Date)[\s:：\-—]+([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const rawDate = match[1].trim();
          const normalized = this.normalizeDate(rawDate);
          return {
            ...this.buildItem('registrationDate', 'Registration Date', rawDate, 0.93, line, false),
            normalizedValue: normalized,
          };
        }
      }
    }

    // Standalone DD/MM/YYYY match
    const dateMatch = raw.match(/\b([0-3]?[0-9][\/\-.][0-1]?[0-9][\/\-.](?:19|20)[0-9]{2})\b/);
    if (dateMatch && dateMatch[1]) {
      const rawDate = dateMatch[1].trim();
      return {
        ...this.buildItem(
          'registrationDate',
          'Registration Date',
          rawDate,
          0.72,
          dateMatch[0],
          true,
          'Extracted via date format heuristic'
        ),
        normalizedValue: this.normalizeDate(rawDate),
      };
    }

    return this.buildMissing('registrationDate', 'Registration Date');
  }

  // --- 12. Document / Reference Number ---
  private extractDocumentNumber(raw: string, lines: string[]): FieldExtractionItem {
    const regexes = [
      /(?:Document\s*(?:No|Number)|Deed\s*(?:No|Number)|Registration\s*(?:No|Number)|Ref\s*(?:No|Number)|दस्तावेज़\s*संख्या|पंजीकरण\s*संख्या|विलेख\s*संख्या)[\s:：\-—]+([A-Za-z0-9\-\/]{3,35})/i,
      /(?:Certificate\s*No|Order\s*No|Patta\s*No)[\s:：\-—]+([A-Za-z0-9\-\/]{3,35})/i,
    ];

    for (const regex of regexes) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (val.length >= 3 && !this.isLabelNoise(val)) {
            return this.buildItem('documentNumber', 'Document / Deed Ref No.', val, 0.94, line, false);
          }
        }
      }
    }

    return this.buildMissing('documentNumber', 'Document / Deed Ref No.');
  }

  // --- Helper Builders ---
  private buildItem(
    fieldName: FieldExtractionItem['fieldName'],
    fieldLabel: string,
    fieldValue: string,
    confidence: number,
    sourceSnippet: string,
    isUncertain: boolean,
    uncertaintyReason?: string
  ): FieldExtractionItem {
    return {
      fieldName,
      fieldLabel,
      fieldValue,
      confidence: Math.min(1.0, Math.max(0.0, Number(confidence.toFixed(2)))),
      sourceSnippet: sourceSnippet.trim(),
      isUncertain,
      isMissing: false,
      status: isUncertain ? 'UNCERTAIN' : 'CONFIRMED',
      validationRulesMet: true,
      validationError: uncertaintyReason,
    };
  }

  private buildMissing(
    fieldName: FieldExtractionItem['fieldName'],
    fieldLabel: string
  ): FieldExtractionItem {
    return {
      fieldName,
      fieldLabel,
      fieldValue: null,
      confidence: 0.0,
      sourceSnippet: null,
      isUncertain: false,
      isMissing: true,
      status: 'MISSING',
      validationRulesMet: false,
      validationError: 'Field not detected in document OCR text',
    };
  }

  private cleanName(text: string): string {
    return text
      .replace(/^(Shri|Smt|Mr|Mrs|Dr|Late|श्री|श्रीमती|स्व\.)\s+/i, '')
      .replace(/[,\r\n].*$/, '')
      .replace(/[;:#$%^*]/g, '')
      .trim();
  }

  private cleanValue(text: string): string {
    return text
      .replace(/[\r\n].*$/, '')
      .replace(/[;:#$^*]/g, '')
      .trim();
  }

  private isLabelNoise(text: string): boolean {
    const lower = text.toLowerCase().trim();
    return (
      lower.length < 2 ||
      ['na', 'n/a', 'null', 'undefined', 'nil', '-', ':', 'none'].includes(lower) ||
      lower.startsWith('page') ||
      lower.startsWith('date') ||
      lower.startsWith('government') ||
      lower.startsWith('section')
    );
  }

  private normalizeDate(dateStr: string): string | null {
    try {
      const parts = dateStr.split(/[\/\-.]/);
      if (parts.length === 3) {
        let [d, m, y] = parts;
        if (y.length === 2) {
          y = parseInt(y, 10) > 40 ? `19${y}` : `20${y}`;
        }
        if (d.length === 4) {
          // YYYY-MM-DD
          return `${d}-${m.padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        // DD-MM-YYYY
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    } catch {
      // Fallback null
    }
    return null;
  }
}
