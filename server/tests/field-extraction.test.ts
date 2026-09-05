import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DeterministicFieldExtractor } from '../src/services/ocr/extractors/deterministic.extractor.js';
import { FieldExtractionFactory } from '../src/services/ocr/extractors/index.js';

describe('Structured Land Record Field Extraction Pipeline', () => {
  const extractor = new DeterministicFieldExtractor();

  it('extracts all 12 fields from standard English land deed OCR text', async () => {
    const ocrSample = `
GOVERNMENT OF RAJASTHAN - REVENUE DEPARTMENT
RECORD OF RIGHTS (ROR) / JAMABANDI - 1430 Fasli
Document Number: DEED/2024/77182
Primary Owner Name: Shri Rameshwar Dayal Sharma
Co-Owner: Smt. Kamla Devi (50% Share)
Khasra Number: 142/4/1
Plot Number: 55-A
Total Area: 0.7500 Hectares
Village: Rampur Khurd
Tehsil: Sanganer
District: Jaipur
State: Rajasthan
Land Type: Agricultural
Registration Date: 22/04/2024
Issued by Revenue Circle Officer
    `;

    const result = await extractor.extractFields(ocrSample);

    assert.equal(result.provider, 'deterministic-rule-engine');
    assert.equal(result.totalFieldsCount, 12);
    assert.equal(result.extractedFieldsCount, 12);
    assert.equal(result.missingFieldsCount, 0);

    // Verify individual fields
    assert.equal(result.fields.owner.fieldValue, 'Rameshwar Dayal Sharma');
    assert.equal(result.fields.owner.status, 'CONFIRMED');
    assert.ok(result.fields.owner.confidence >= 0.85);
    assert.ok(result.fields.owner.sourceSnippet?.includes('Rameshwar Dayal Sharma'));

    assert.equal(result.fields.coOwner.fieldValue, 'Smt. Kamla Devi (50% Share)');
    assert.equal(result.fields.khasraNumber.fieldValue, '142/4/1');
    assert.equal(result.fields.plotNumber.fieldValue, '55-A');
    assert.equal(result.fields.area.fieldValue, '0.7500 Hectares');
    assert.equal(result.fields.village.fieldValue, 'Rampur Khurd');
    assert.equal(result.fields.tehsil.fieldValue, 'Sanganer');
    assert.equal(result.fields.district.fieldValue, 'Jaipur');
    assert.equal(result.fields.state.fieldValue, 'Rajasthan');
    assert.ok(result.fields.landType.fieldValue?.includes('Agricultural'));
    assert.equal(result.fields.registrationDate.fieldValue, '22/04/2024');
    assert.equal(result.fields.registrationDate.normalizedValue, '2024-04-22');
    assert.equal(result.fields.documentNumber.fieldValue, 'DEED/2024/77182');
  });

  it('extracts Hindi terminology land records', async () => {
    const hindiSample = `
उत्तर प्रदेश सरकार - राजस्व विभाग
खतौनी / अधिकार अभिलेख
दस्तावेज़ संख्या: UP-DEED-2023-8819
खातेदार: श्री मोहन लाल वर्मा
सह-खातेदार: श्रीमती विमला देवी
खसरा संख्या: 205/3
भूखंड संख्या: B-12
क्षेत्रफल: 1.2500 हेक्टेयर
ग्राम: रामपुर
तहसील: बिलासपुर
ज़िला: रामपुर
राज्य: उत्तर प्रदेश
किस्म जमीन: कृषि
पंजीकरण दिनांक: 15/08/2023
    `;

    const result = await extractor.extractFields(hindiSample);

    assert.equal(result.fields.owner.fieldValue, 'मोहन लाल वर्मा');
    assert.equal(result.fields.coOwner.fieldValue, 'श्रीमती विमला देवी');
    assert.equal(result.fields.khasraNumber.fieldValue, '205/3');
    assert.equal(result.fields.plotNumber.fieldValue, 'B-12');
    assert.equal(result.fields.village.fieldValue, 'रामपुर');
    assert.equal(result.fields.tehsil.fieldValue, 'बिलासपुर');
    assert.equal(result.fields.district.fieldValue, 'रामपुर');
    assert.equal(result.fields.state.fieldValue, 'उत्तर प्रदेश');
    assert.equal(result.fields.documentNumber.fieldValue, 'UP-DEED-2023-8819');
  });

  it('explicitly marks missing fields as MISSING and never invents values', async () => {
    const incompleteOcr = `
Village: Rampur
Khasra No: 88/2
Land Type: Agricultural
    `;

    const result = await extractor.extractFields(incompleteOcr);

    // Khasra, Village, and Land Type exist
    assert.equal(result.fields.khasraNumber.isMissing, false);
    assert.equal(result.fields.khasraNumber.fieldValue, '88/2');
    assert.equal(result.fields.village.isMissing, false);
    assert.equal(result.fields.village.fieldValue, 'Rampur');

    // Missing fields must be null and flagged
    assert.equal(result.fields.owner.isMissing, true);
    assert.equal(result.fields.owner.fieldValue, null);
    assert.equal(result.fields.owner.status, 'MISSING');
    assert.equal(result.fields.owner.confidence, 0);

    assert.equal(result.fields.coOwner.isMissing, true);
    assert.equal(result.fields.plotNumber.isMissing, true);
    assert.equal(result.fields.district.isMissing, true);
    assert.equal(result.fields.documentNumber.isMissing, true);

    assert.equal(result.missingFieldsCount >= 6, true);
  });

  it('FieldExtractionFactory resolves deterministic engine default', () => {
    const instance = FieldExtractionFactory.getExtractor('deterministic');
    assert.equal(instance.providerName, 'deterministic-rule-engine');
  });
});
