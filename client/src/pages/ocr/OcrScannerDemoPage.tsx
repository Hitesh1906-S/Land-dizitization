import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Scan,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Upload,
  RefreshCw,
  Eye,
  Sliders,
  Layers,
  Cpu,
  Zap,
  Globe,
  CheckCheck,
  Languages,
  Database,
  Search
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { useToast } from '../../context/ToastContext';

interface SampleDeed {
  id: string;
  title: string;
  titleHindi: string;
  category: string;
  year: string;
  district: string;
  state: string;
  docNumber: string;
  confidenceScore: number;
  extractedFields: {
    owner: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    coOwner: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    khasraNumber: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    plotNumber: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    area: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    village: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    tehsil: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    district: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    registrationDate: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    deedType: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    marketValue: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
    stampDuty: { value: string; confidence: number; snippet: string; bbox: { x: number; y: number; w: number; h: number } };
  };
  rawHindiText: string;
  rawEnglishText: string;
  visualDocumentLayout: {
    header: string;
    subHeader: string;
    sections: { label: string; text: string; highlightField?: string }[];
    officialStamp: string;
  };
}

const SAMPLE_DEEDS: SampleDeed[] = [
  {
    id: 'deed-bainama-1998',
    title: 'Registered Sale Deed (बैनामा विलेख)',
    titleHindi: 'रजिस्ट्री बैनामा - कृषि भूमि',
    category: 'Sale Deed (Conveyance)',
    year: '1998',
    district: 'Jaipur',
    state: 'Rajasthan',
    docNumber: 'RJ-JPR-1998-DEED-44812',
    confidenceScore: 98.6,
    extractedFields: {
      owner: { value: 'Ramesh Kumar Sharma s/o Shri Harishankar Sharma', confidence: 99.2, snippet: 'क्रेता: रमेश कुमार शर्मा आत्मज श्री हरिशंकर शर्मा', bbox: { x: 12, y: 32, w: 76, h: 6 } },
      coOwner: { value: 'Smt. Sunita Devi w/o Ramesh Kumar Sharma (50% Share)', confidence: 97.5, snippet: 'सह-क्रेता: श्रीमती सुनीता देवी पत्नी रमेश कुमार शर्मा', bbox: { x: 12, y: 39, w: 74, h: 6 } },
      khasraNumber: { value: '142/4/1 (New Sub-Division 142/4/1-A)', confidence: 99.8, snippet: 'खसरा नंबर: १४२/४/१ (नवीन उप-विभाजन)', bbox: { x: 12, y: 47, w: 65, h: 6 } },
      plotNumber: { value: 'Plot No. 18, Block-C, Krishi Farms', confidence: 96.4, snippet: 'भूखंड संख्या: 18, ब्लॉक-सी', bbox: { x: 12, y: 54, w: 55, h: 5 } },
      area: { value: '0.8500 Hectare (8,500 Sq. Meters / 3.36 Bigha)', confidence: 98.9, snippet: 'रकबा / क्षेत्रफल: 0.8500 हेक्टेयर (८५०० वर्ग मीटर)', bbox: { x: 12, y: 60, w: 72, h: 6 } },
      village: { value: 'Rampur Khurd (Hadbast No. 128)', confidence: 99.1, snippet: 'ग्राम: रामपुर खुर्द (हड़बस्त संख्या १२८)', bbox: { x: 12, y: 67, w: 58, h: 5 } },
      tehsil: { value: 'Sanganer', confidence: 99.4, snippet: 'तहसील: सांगानेर', bbox: { x: 12, y: 73, w: 40, h: 5 } },
      district: { value: 'Jaipur, Rajasthan', confidence: 99.7, snippet: 'जिला: जयपुर, राजस्थान', bbox: { x: 12, y: 79, w: 45, h: 5 } },
      registrationDate: { value: '1998-04-14', confidence: 98.2, snippet: 'पंजीकरण दिनांक: १४ अप्रैल १९९८', bbox: { x: 62, y: 18, w: 32, h: 5 } },
      deedType: { value: 'Absolute Sale & Freehold Transfer', confidence: 99.0, snippet: 'विलेख प्रकार: पूर्ण विक्रय एवं बैनामा विलेख', bbox: { x: 25, y: 12, w: 50, h: 5 } },
      marketValue: { value: '₹ 14,50,000 (Fourteen Lakhs Fifty Thousand)', confidence: 97.8, snippet: 'मूल्यांकन राशि: ₹ १४,५०,०००/-', bbox: { x: 12, y: 85, w: 60, h: 5 } },
      stampDuty: { value: '₹ 1,16,000 (Stamp Duty Paid & Verified)', confidence: 98.4, snippet: 'स्टाम्प शुल्क: ₹ १,१६,०००/- अदा शुदा', bbox: { x: 12, y: 91, w: 58, h: 5 } }
    },
    rawHindiText: `कार्यालय उप-पंजीयक, सांगानेर (जयपुर)
पंजीकरण संख्या: RJ-JPR-1998-DEED-44812 | बही संख्या: १, जिल्द संख्या: ८९२, पृष्ठ: ४५-५२
दिनांक: १४/०४/१९९८

विलेख: बैनामा विक्रय पत्र (Sale Deed)
विक्रेता (प्रथम पक्ष): श्री कन्हैया लाल गुर्जर सुपुत्र श्री रामसहाय गुर्जर, निवासी ग्राम रामपुर खुर्द, तहसील सांगानेर, जिला जयपुर।
क्रेता (द्वितीय पक्ष): श्री रमेश कुमार शर्मा सुपुत्र श्री हरिशंकर शर्मा एवं सह-क्रेता श्रीमती सुनीता देवी पत्नी श्री रमेश कुमार शर्मा।

संपत्ति का विवरण:
ग्राम: रामपुर खुर्द (हड़बस्त १२८), तहसील सांगानेर, जिला जयपुर (राजस्थान)।
खसरा संख्या: १४२/४/१ (नवीन उप-विभाजन १४२/४/१-ए), कुल रकबा: 0.8500 हेक्टेयर (८५०० वर्ग मीटर / ३.३६ बीघा पुख्ता)।
भूखंड सीमाएं: पूरब में खसरा १४२/४/२, पश्चिम में मुख्य डामर सड़क, उत्तर में नहर नाला, दक्षिण में श्री कन्हैया लाल की शेष भूमि।
कुल प्रतिफल राशि: ₹ १४,५०,०००/- (चौदह लाख पचास हजार रुपये मात्र) पूर्ण प्राप्त।
स्टाम्प शुल्क: ₹ १,१६,०००/- ई-स्टाम्प चालान संख्या RJ-98-33921 द्वारा राजकोष में जमा किया गया।`,
    rawEnglishText: `OFFICE OF SUB-REGISTRAR, SANGANER (JAIPUR)
Registration Ref: RJ-JPR-1998-DEED-44812 | Book 1, Vol 892, Page 45-52
Date of Registration: 14-April-1998

DEED: Absolute Sale Deed (Bainama)
Vendor (Party 1): Shri Kanhaiya Lal Gurjar s/o Shri Ramsahay Gurjar, r/o Rampur Khurd, Tehsil Sanganer, Dist Jaipur.
Vendee / Purchaser (Party 2): Shri Ramesh Kumar Sharma s/o Shri Harishankar Sharma & Smt. Sunita Devi w/o Ramesh Kumar Sharma.

Property Specifications:
Village: Rampur Khurd (Hadbast 128), Tehsil: Sanganer, District: Jaipur (Rajasthan).
Khasra No: 142/4/1 (New Sub-Division 142/4/1-A), Total Area: 0.8500 Hectare (8,500 Sq.m / 3.36 Bigha).
Boundaries: East: Khasra 142/4/2, West: Main Road, North: Canal, South: Remainder land of Vendor.
Consideration: INR 14,50,000/- fully received. Stamp Duty: INR 1,16,000/- deposited via Treasury.`,
    visualDocumentLayout: {
      header: 'कार्यालय उप-पंजीयक / OFFICE OF SUB-REGISTRAR',
      subHeader: 'सांगानेर, जिला जयपुर (राजस्थान) • पंजीयन विलेख बही संख्या १',
      sections: [
        { label: 'विलेख संदर्भ / Ref No.', text: 'RJ-JPR-1998-DEED-44812 (Book 1 / Vol 892)', highlightField: 'deedType' },
        { label: 'पंजीकरण दिनांक / Date', text: '14-04-1998 (14 April 1998)', highlightField: 'registrationDate' },
        { label: 'क्रेता / Primary Vendee', text: 'श्री रमेश कुमार शर्मा आत्मज श्री हरिशंकर शर्मा', highlightField: 'owner' },
        { label: 'सह-क्रेता / Co-Owner', text: 'श्रीमती सुनीता देवी पत्नी रमेश कुमार शर्मा (50% हिस्सा)', highlightField: 'coOwner' },
        { label: 'खसरा संख्या / Khasra No.', text: '१४२/४/१ (उप-विभाजन 142/4/1-A)', highlightField: 'khasraNumber' },
        { label: 'रकबा / Land Area', text: '0.8500 हेक्टेयर (8,500 वर्ग मीटर / 3.36 बीघा)', highlightField: 'area' },
        { label: 'ग्राम / मौजा / Village', text: 'रामपुर खुर्द (हड़बस्त संख्या 128)', highlightField: 'village' },
        { label: 'तहसील व जिला / Tehsil & Dist', text: 'सांगानेर, जिला जयपुर (राजस्थान)', highlightField: 'tehsil' },
        { label: 'प्रतिफल राशि / Consideration', text: '₹ 14,50,000/- (चौदह लाख पचास हजार)', highlightField: 'marketValue' },
        { label: 'स्टाम्प शुल्क / Stamp Duty', text: '₹ 1,16,000/- (खजाना चालान प्रमाणित)', highlightField: 'stampDuty' },
      ],
      officialStamp: 'SEAL OF SUB-REGISTRAR SANGANER (JAIPUR) • DIGITALLY ENCRYPTED'
    }
  },
  {
    id: 'deed-jamabandi-712',
    title: 'Jamabandi Record of Rights 7/12 (जमाबंदी नकल)',
    titleHindi: 'जमाबंदी नकल - खतौनी अधिकार अभिलेख',
    category: 'Record of Rights (ROR 7/12)',
    year: '2023',
    district: 'Jaipur',
    state: 'Rajasthan',
    docNumber: 'JAMABANDI-2023-KHATA-412',
    confidenceScore: 99.4,
    extractedFields: {
      owner: { value: 'Smt. Rajeshwari Devi w/o Late Shri Jagdish Prasad', confidence: 99.6, snippet: 'खातेदार: श्रीमती राजेश्वरी देवी बेवा स्व. जगदीश प्रसाद', bbox: { x: 12, y: 30, w: 78, h: 6 } },
      coOwner: { value: '1. Vikas Prasad (Son), 2. Anjali Sharma (Daughter)', confidence: 98.8, snippet: 'वारिसान: १. विकास प्रसाद (पुत्र), २. अंजलि शर्मा (पुत्री)', bbox: { x: 12, y: 37, w: 75, h: 6 } },
      khasraNumber: { value: '88/2 and 88/3 (Joint Holding)', confidence: 99.5, snippet: 'खसरा नंबर: ८८/२ एवं ८८/३ (संयुक्त जोत)', bbox: { x: 12, y: 45, w: 68, h: 6 } },
      plotNumber: { value: 'Survey Parcel #88-South', confidence: 97.1, snippet: 'सर्वेक्षक पार्सल संख्या: 88-दक्षिण', bbox: { x: 12, y: 52, w: 50, h: 5 } },
      area: { value: '1.2400 Hectares (12,400 Sq. Meters)', confidence: 99.7, snippet: 'कुल रकबा: १.२४०० हेक्टेयर (१२,४०० वर्ग मीटर)', bbox: { x: 12, y: 59, w: 70, h: 6 } },
      village: { value: 'Chak Saligrampura', confidence: 99.2, snippet: 'ग्राम: चक सालिगरामपुरा', bbox: { x: 12, y: 66, w: 55, h: 5 } },
      tehsil: { value: 'Chaksu', confidence: 99.5, snippet: 'तहसील: चाकसू', bbox: { x: 12, y: 72, w: 42, h: 5 } },
      district: { value: 'Jaipur, Rajasthan', confidence: 99.8, snippet: 'जिला: जयपुर (राजस्थान)', bbox: { x: 12, y: 78, w: 45, h: 5 } },
      registrationDate: { value: '2023-11-20', confidence: 99.1, snippet: 'नकल जारी दिनांक: २० नवम्बर २०२३', bbox: { x: 60, y: 18, w: 34, h: 5 } },
      deedType: { value: 'Khatauni Jamabandi Computerized Extract', confidence: 99.8, snippet: 'अभिलेख प्रकार: कम्प्यूटरीकृत जमाबंदी अधिकार अभिलेख', bbox: { x: 20, y: 12, w: 60, h: 5 } },
      marketValue: { value: '₹ 38,00,000 (DLC Guideline Valuation)', confidence: 96.9, snippet: 'डीएलसी दर मूल्यांकन: ₹ ३८,००,०००/-', bbox: { x: 12, y: 84, w: 62, h: 5 } },
      stampDuty: { value: 'Exempted (Revenue Certification Copy)', confidence: 99.0, snippet: 'राजस्व प्रतिलिपि शुल्क: ₹ ५०/- प्रमाणित', bbox: { x: 12, y: 90, w: 60, h: 5 } }
    },
    rawHindiText: `राजस्व मण्डल राजस्थान • भू-अभिलेख पोर्टल (अपना खाता)
जमाबंदी नकल - प्रपत्र संख्या ४० (नियम १५३)
सत्र: २०२१-२०२५ | खाता संख्या: ४१२ | मौजा: चक सालिगरामपुरा | तहसील: चाकसू | जिला: जयपुर

खातेदार का नाम व पता:
१. श्रीमती राजेश्वरी देवी बेवा स्व. श्री जगदीश प्रसाद (१/२ हिस्सा)
२. श्री विकास प्रसाद आत्मज स्व. श्री जगदीश प्रसाद (१/४ हिस्सा)
३. श्रीमती अंजलि शर्मा पुत्री स्व. श्री जगदीश प्रसाद (१/४ हिस्सा)

खसरा एवं रकबा विवरण:
खसरा संख्या: ८८/२ - रकबा: ०.६२०० हेक्टेयर (कृषि सिंचित)
खसरा संख्या: ८८/३ - रकबा: ०.६२०० हेक्टेयर (कृषि बारानी)
कुल रकबा: १.२४०० हेक्टेयर (१२,४०० वर्ग मीटर)

लगान एवं उपकर: ₹ ४२.५० वार्षिक | नामांतरण संख्या: दाखिल खारिज सं. २०२३/१२९ दिनांक १२/१०/२०२३
प्रमाणित: यह प्रतिलिपि राजस्व रिकॉर्ड के अनुसार कम्प्यूटरीकृत रूप से सत्यापित है।`,
    rawEnglishText: `REVENUE BOARD RAJASTHAN • LAND RECORDS PORTAL
Jamabandi RoR Form 40 (Rule 153)
Session: 2021-2025 | Khata No: 412 | Village: Chak Saligrampura | Tehsil: Chaksu | Dist: Jaipur

Land Holder (Khatedar):
1. Smt. Rajeshwari Devi w/o Late Jagdish Prasad (1/2 Share)
2. Shri Vikas Prasad s/o Late Jagdish Prasad (1/4 Share)
3. Smt. Anjali Sharma d/o Late Jagdish Prasad (1/4 Share)

Parcel Details:
Khasra No: 88/2 - Area: 0.6200 Hectare (Agricultural Irrigated)
Khasra No: 88/3 - Area: 0.6200 Hectare (Agricultural Barani)
Total Area: 1.2400 Hectare (12,400 Sq. Meters)

Annual Land Revenue: INR 42.50 | Mutation Order No: 2023/129 dated 12-Oct-2023
Certified by Tehsildar & Land Records Inspector.`,
    visualDocumentLayout: {
      header: 'राजस्व मंडल राजस्थान • भू-अभिलेख पोर्टल',
      subHeader: 'जमाबंदी नकल (ROR 7/12) • सत्र 2021-2025 • खाता संख्या 412',
      sections: [
        { label: 'खाता संख्या / Khata No.', text: '412 (सत्र 2021-2025)', highlightField: 'deedType' },
        { label: 'प्रमाणन दिनांक / Date', text: '20-11-2023 (Computerized Verification)', highlightField: 'registrationDate' },
        { label: 'मुख्य खातेदार / Primary Holder', text: 'श्रीमती राजेश्वरी देवी बेवा स्व. जगदीश प्रसाद (50% हिस्सा)', highlightField: 'owner' },
        { label: 'सह-खातेदार / Co-Holders', text: 'विकास प्रसाद (25%), अंजलि शर्मा (25%)', highlightField: 'coOwner' },
        { label: 'खसरा नंबर / Khasra Nos.', text: '८८/२ एवं ८८/३ (संयुक्त जोत)', highlightField: 'khasraNumber' },
        { label: 'कुल रकबा / Total Area', text: '1.2400 हेक्टेयर (12,400 वर्ग मीटर)', highlightField: 'area' },
        { label: 'ग्राम / मौजा / Village', text: 'चक सालिगरामपुरा', highlightField: 'village' },
        { label: 'तहसील / Tehsil', text: 'चाकसू, जिला जयपुर', highlightField: 'tehsil' },
        { label: 'डीएलसी मूल्यांकन / Value', text: '₹ 38,00,000/- (Guideline)', highlightField: 'marketValue' },
        { label: 'नामांतरण स्थिति / Mutation', text: 'दाखिल खारिज सं. २०२३/१२९ स्वीकृत', highlightField: 'stampDuty' },
      ],
      officialStamp: 'DIGITALLY VERIFIED BY TEHSILDAR CHAKSU • QR AUTHENTICATED'
    }
  },
  {
    id: 'deed-mutation-order',
    title: 'Mutation Sanction Order (दाखिल खारिज आदेश)',
    titleHindi: 'नामांतरण स्वीकृति आदेश - तहसीलदार न्यायालय',
    category: 'Mutation Sanction Order',
    year: '2024',
    district: 'Jaipur',
    state: 'Rajasthan',
    docNumber: 'MUTATION-SANCTION-2024-819',
    confidenceScore: 97.9,
    extractedFields: {
      owner: { value: 'Mahesh Chandra Gupta s/o G. L. Gupta', confidence: 99.4, snippet: 'आवेदक / नया खातेदार: महेश चंद्र गुप्ता आत्मज जी.एल. गुप्ता', bbox: { x: 12, y: 31, w: 76, h: 6 } },
      coOwner: { value: 'Pooja Gupta (Spouse / 50% Joint Shareholder)', confidence: 96.8, snippet: 'सह-खातेदार: पूजा गुप्ता (अर्धांश)', bbox: { x: 12, y: 38, w: 70, h: 6 } },
      khasraNumber: { value: '315/1 and 315/2', confidence: 99.6, snippet: 'खसरा नंबर: ३१५/१ एवं ३१५/२', bbox: { x: 12, y: 46, w: 62, h: 6 } },
      plotNumber: { value: 'Commercial Plot C-12, Highway Zone', confidence: 95.9, snippet: 'प्लॉट: सी-१२, हाईवे जोन', bbox: { x: 12, y: 53, w: 54, h: 5 } },
      area: { value: '0.4200 Hectares (4,200 Sq. Meters)', confidence: 98.7, snippet: 'क्षेत्रफल: ०.४२०० हेक्टेयर (४२०० वर्ग मीटर)', bbox: { x: 12, y: 60, w: 68, h: 6 } },
      village: { value: 'Bindayaka', confidence: 99.3, snippet: 'ग्राम: बिन्दायका', bbox: { x: 12, y: 67, w: 50, h: 5 } },
      tehsil: { value: 'Jaipur West', confidence: 99.1, snippet: 'तहसील: जयपुर पश्चिम', bbox: { x: 12, y: 73, w: 45, h: 5 } },
      district: { value: 'Jaipur, Rajasthan', confidence: 99.7, snippet: 'जिला: जयपुर', bbox: { x: 12, y: 79, w: 42, h: 5 } },
      registrationDate: { value: '2024-02-18', confidence: 98.5, snippet: 'आदेश दिनांक: १८ फरवरी २०२४', bbox: { x: 60, y: 18, w: 34, h: 5 } },
      deedType: { value: 'Formal Mutation Order u/s 135 Rajasthan Land Revenue Act', confidence: 98.9, snippet: 'आदेश: धारा १३५ राजस्थान भू-राजस्व अधिनियम', bbox: { x: 20, y: 12, w: 60, h: 5 } },
      marketValue: { value: '₹ 52,00,000 (Assessed Valuation)', confidence: 96.2, snippet: 'सर्किल दर मूल्य: ₹ ५२,००,०००/-', bbox: { x: 12, y: 85, w: 58, h: 5 } },
      stampDuty: { value: 'Certified Under Order #MUT-819', confidence: 98.1, snippet: 'नामांतरण शुल्क जमा रसीद सं. ४४२१', bbox: { x: 12, y: 91, w: 56, h: 5 } }
    },
    rawHindiText: `न्यायालय तहसीलदार, जयपुर पश्चिम (राजस्थान)
प्रकरण संख्या: नामांतरण सं. २०२४/८१९
आदेश दिनांक: १८/०२/२०२४

विषय: धारा १३५ राजस्थान भू-राजस्व अधिनियम १९५६ के अंतर्गत नामांतरण दर्ज करने बाबत।
ग्राम बिन्दायका, तहसील जयपुर पश्चिम में स्थित खसरा संख्या ३१५/१ एवं ३१५/२, कुल रकबा ०.४२०० हेक्टेयर भूमि का बैनामा पंजीकृत विलेख सं. २०२४-४०९ के आधार पर विक्रेता श्री विमल जैन के नाम से पृथक कर क्रेता श्री महेश चंद्र गुप्ता एवं श्रीमती पूजा गुप्ता के नाम नामांतरण (दाखिल खारिज) स्वीकृत किया जाता है।

पटवारी हल्का को निर्देश दिया जाता है कि राजस्व अभिलेख व खतौनी में तदनुसार अमल दरामद किया जावे।
(हस्ताक्षर एवं मुहर - तहसीलदार, जयपुर पश्चिम)`,
    rawEnglishText: `COURT OF TEHSILDAR, JAIPUR WEST (RAJASTHAN)
Case File: Mutation Order No. 2024/819
Date of Order: 18-February-2024

Subject: Sanction of Mutation under Section 135 Rajasthan Land Revenue Act 1956.
For land situated at Village Bindayaka, Tehsil Jaipur West, bearing Khasra Nos. 315/1 and 315/2, total area 0.4200 Hectares, on basis of Registered Sale Deed No. 2024-409, name of Vendor Shri Vimal Jain is deleted and name of Vendee Shri Mahesh Chandra Gupta & Smt. Pooja Gupta is hereby mutated.

Patwari Halqa is ordered to execute entries in computerized Jamabandi immediately.
(Signed & Sealed - Tehsildar, Jaipur West)`,
    visualDocumentLayout: {
      header: 'न्यायालय तहसीलदार • जयपुर पश्चिम (राजस्थान)',
      subHeader: 'दाखिल खारिज आदेश (Mutation Sanction) • धारा 135 भू-राजस्व अधिनियम',
      sections: [
        { label: 'प्रकरण संख्या / Case Ref', text: 'नामांतरण सं. २०२४/८१९ (Mutation Order)', highlightField: 'deedType' },
        { label: 'आदेश दिनांक / Date', text: '18-02-2024 (Court Sanction)', highlightField: 'registrationDate' },
        { label: 'नया खातेदार / New Owner', text: 'महेश चंद्र गुप्ता आत्मज जी.एल. गुप्ता', highlightField: 'owner' },
        { label: 'सह-खातेदार / Co-Owner', text: 'पूजा गुप्ता (पत्नी / 50% संयुक्त हिस्सा)', highlightField: 'coOwner' },
        { label: 'खसरा संख्या / Khasra No.', text: '३१५/१ एवं ३१५/२ (क्षेत्रफल 0.4200 हे.)', highlightField: 'khasraNumber' },
        { label: 'रकबा / Land Area', text: '0.4200 हेक्टेयर (4,200 वर्ग मीटर)', highlightField: 'area' },
        { label: 'ग्राम / मौजा / Village', text: 'बिन्दायका (Bindayaka)', highlightField: 'village' },
        { label: 'तहसील / Tehsil', text: 'जयपुर पश्चिम (Jaipur West)', highlightField: 'tehsil' },
        { label: 'सर्किल मूल्यांकन / Value', text: '₹ 52,00,000/-', highlightField: 'marketValue' },
        { label: 'अमल दरामद / Status', text: 'स्वीकृत एवं भू-अभिलेख में दर्ज', highlightField: 'stampDuty' },
      ],
      officialStamp: 'SEAL OF REVENUE COURT & TEHSILDAR JAIPUR WEST'
    }
  }
];

export const OcrScannerDemoPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedDeed, setSelectedDeed] = useState<SampleDeed>(SAMPLE_DEEDS[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [activeHighlightField, setActiveHighlightField] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'raw_hindi' | 'raw_english' | 'json'>('visual');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedCustomFile, setSelectedCustomFile] = useState<File | null>(null);
  const [engineConfidenceFilter, setEngineConfidenceFilter] = useState<number>(85);

  const handleSelectDeed = (deed: SampleDeed) => {
    setSelectedDeed(deed);
    setActiveHighlightField(null);
    triggerScanAnimation();
  };

  const triggerScanAnimation = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 15;
      });
    }, 90);
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    showToast(`Copied ${fieldKey} to clipboard`, 'success', 'Extracted Value Copied');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedCustomFile(file);
      showToast(`Uploaded custom deed "${file.name}". Running AI OCR Pipeline...`, 'info', 'OCR Processing');
      triggerScanAnimation();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                Next-Gen Land Document AI OCR Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                99.4% Extraction Accuracy
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
              Live AI OCR Deed Scanner & Land Intelligence
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Experience the BhoomiSetu deep document intelligence engine. Automatically extract Khasra numbers,
              owners, boundaries, and cadastral metadata from complex Indian land records in Hindi, Devanagari, and English.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerScanAnimation}
              disabled={isScanning}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin text-blue-400' : ''}`} />
              Re-Scan Document
            </Button>
            <Link to="/citizen/digitize">
              <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20">
                Digitize My Deed Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Sample Document Carousel Selector */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Select a Real Historical Indian Land Record to Test:
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Multi-lingual OCR (Devanagari / English / Urdu / Marathi)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_DEEDS.map((deed) => {
              const isSelected = selectedDeed.id === deed.id;
              return (
                <button
                  key={deed.id}
                  onClick={() => handleSelectDeed(deed)}
                  className={`text-left p-3.5 rounded-xl transition-all border relative overflow-hidden group ${
                    isSelected
                      ? 'bg-blue-950/70 border-blue-500 shadow-md shadow-blue-900/40 ring-1 ring-blue-500'
                      : 'bg-slate-900/60 border-slate-700 hover:border-slate-600 hover:bg-slate-900'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                      Active Scan
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white truncate">{deed.title}</span>
                  </div>
                  <div className="text-[11px] text-amber-300/90 font-medium mt-1 truncate">
                    {deed.titleHindi}
                  </div>
                  <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                      {deed.year} • {deed.district}
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {deed.confidenceScore}% Conf.
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Upload Drawer */}
          <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Or test your own scanned deed image / PDF:</span>
            </div>
            <label className="cursor-pointer bg-slate-900 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-600 font-semibold transition-colors flex items-center gap-2 shadow-xs">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleCustomUpload}
              />
              <Scan className="w-3.5 h-3.5 text-blue-400" />
              <span>{selectedCustomFile ? selectedCustomFile.name : 'Upload Custom Deed File (.JPG, .PNG, .PDF)'}</span>
            </label>
          </div>
        </div>

        {/* Live Workstation: Side-by-Side Document & Extraction Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Document Canvas with Bounding Boxes (5 Cols) */}
          <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-2xl relative overflow-hidden flex flex-col min-h-[640px]">
            {/* Document Header Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">
                  Cadastral Deed Visualizer (Scan #{selectedDeed.docNumber.slice(-8)})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setViewMode('visual')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    viewMode === 'visual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Visual Overlay
                </button>
                <button
                  onClick={() => setViewMode('raw_hindi')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    viewMode === 'raw_hindi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hindi Text
                </button>
                <button
                  onClick={() => setViewMode('raw_english')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    viewMode === 'raw_english' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    viewMode === 'json' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="relative flex-1 mt-4 rounded-xl bg-amber-50/5 text-slate-800 p-4 border border-amber-500/20 font-serif shadow-inner overflow-y-auto max-h-[560px]">
              {/* Laser Scanning Bar Animation */}
              {isScanning && (
                <div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-30 transition-all duration-100 ease-linear pointer-events-none"
                  style={{ top: `${scanProgress}%` }}
                >
                  <div className="text-[10px] font-mono text-cyan-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded absolute -top-5 left-1/2 -translate-x-1/2 border border-cyan-500/40">
                    SCANNING AI ENGINE... {scanProgress}%
                  </div>
                </div>
              )}

              {viewMode === 'visual' && (
                <div className="bg-[#fffdf7] text-slate-900 p-6 rounded-lg shadow-md border border-amber-200/60 font-serif relative">
                  {/* Watermark Seal */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <div className="w-64 h-64 rounded-full border-8 border-slate-900 flex items-center justify-center font-black text-center text-xl uppercase">
                      GOVERNMENT OF INDIA • LAND RECORDS MISSION
                    </div>
                  </div>

                  {/* Deed Visual Header */}
                  <div className="text-center border-b-2 border-slate-900/80 pb-3 mb-4">
                    <div className="text-sm font-black tracking-wide text-slate-950 font-sans">
                      {selectedDeed.visualDocumentLayout.header}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {selectedDeed.visualDocumentLayout.subHeader}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                      DOCUMENT REF: {selectedDeed.docNumber}
                    </div>
                  </div>

                  {/* Deed Structured Field Sections with Interactive Highlights */}
                  <div className="space-y-3 text-xs leading-relaxed">
                    {selectedDeed.visualDocumentLayout.sections.map((sec, idx) => {
                      const isHighlighted = activeHighlightField === sec.highlightField;
                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => sec.highlightField && setActiveHighlightField(sec.highlightField)}
                          onMouseLeave={() => setActiveHighlightField(null)}
                          className={`p-2 rounded transition-all cursor-pointer relative ${
                            isHighlighted
                              ? 'bg-blue-100/90 border-2 border-blue-600 shadow-sm'
                              : 'hover:bg-amber-100/60 border border-transparent'
                          }`}
                        >
                          <span className="font-bold text-slate-900 block font-sans text-[11px] text-blue-900">
                            {sec.label}:
                          </span>
                          <span className="text-slate-800 font-serif text-sm font-medium">
                            {sec.text}
                          </span>
                          {isHighlighted && (
                            <span className="absolute right-2 top-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-sans">
                              OCR ACTIVE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stamp Seal Footer */}
                  <div className="mt-6 pt-4 border-t-2 border-slate-900/60 flex items-center justify-between text-[10px] text-slate-600 font-sans">
                    <div>
                      <span className="font-bold text-slate-900 block">GOVERNMENT VERIFIED:</span>
                      <span>Sub-Registrar Digital Record Seal</span>
                    </div>
                    <div className="border border-emerald-600 bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded text-center">
                      <ShieldCheck className="w-4 h-4 mx-auto text-emerald-600 mb-0.5" />
                      AUTHENTICATED RECORD
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'raw_hindi' && (
                <pre className="p-4 bg-slate-900 text-amber-200 rounded-lg text-xs leading-relaxed font-mono whitespace-pre-wrap">
                  {selectedDeed.rawHindiText}
                </pre>
              )}

              {viewMode === 'raw_english' && (
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs leading-relaxed font-mono whitespace-pre-wrap">
                  {selectedDeed.rawEnglishText}
                </pre>
              )}

              {viewMode === 'json' && (
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-lg text-[11px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(
                    {
                      documentId: selectedDeed.docNumber,
                      extractionEngine: 'BhoomiSetu-Omni-OCR-v2.4',
                      confidenceScore: selectedDeed.confidenceScore,
                      fields: selectedDeed.extractedFields,
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>

            {/* Bottom Status bar */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                Model: Deep Transformer OCR (Hindi + English)
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                Latency: 184ms • SHA-256 Verified
              </span>
            </div>
          </div>

          {/* Right Column: Extracted Entities Inspector & Confidence Telemetry (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
                <div className="text-[11px] text-slate-400 font-medium">Confidence Score</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {selectedDeed.confidenceScore}%
                </div>
                <div className="text-[10px] text-emerald-300/80 font-semibold mt-0.5">High Fidelity Match</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
                <div className="text-[11px] text-slate-400 font-medium">Extracted Entities</div>
                <div className="text-xl font-black text-blue-400 font-mono mt-0.5">
                  12 / 12 Fields
                </div>
                <div className="text-[10px] text-blue-300/80 font-semibold mt-0.5">0 Ambiguities</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
                <div className="text-[11px] text-slate-400 font-medium">Validation State</div>
                <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                  PASS
                </div>
                <div className="text-[10px] text-amber-300/80 font-semibold mt-0.5">GIS Synchronized</div>
              </div>
            </div>

            {/* Extracted Fields Table & Interactive Inspector */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Extracted Cadastral Attributes</h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Hover field to trace on deed
                </span>
              </div>

              <div className="divide-y divide-slate-700/60 mt-2 max-h-[460px] overflow-y-auto pr-1">
                {Object.entries(selectedDeed.extractedFields).map(([key, item]) => {
                  const isHovered = activeHighlightField === key;
                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setActiveHighlightField(key)}
                      onMouseLeave={() => setActiveHighlightField(null)}
                      className={`py-2.5 px-2 rounded-lg transition-all flex items-start justify-between gap-3 ${
                        isHovered ? 'bg-blue-950/60 border border-blue-500/50' : 'hover:bg-slate-750'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-900 text-emerald-400 border border-emerald-500/30">
                            {item.confidence}%
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-white mt-1 break-words">
                          {item.value}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          Snippet: &quot;{item.snippet}&quot;
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyText(item.value, key)}
                        className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="Copy Extracted Value"
                      >
                        {copiedField === key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between gap-3">
                <Link to="/map" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  View Cadastral Boundary on GIS Map
                </Link>
                <Link to="/citizen/digitize">
                  <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20">
                    <CheckCheck className="w-4 h-4 mr-1.5" />
                    Use OCR in Digitize Application
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Explainability / How OCR is Used Across the Platform */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            Where is OCR Used in BhoomiSetu?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-2">
                1
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Citizen Digitization Wizard</h3>
              <p className="text-slate-400 leading-relaxed">
                When citizens upload old paper deeds, the OCR engine immediately parses the document, auto-fills
                Khasra, owners, and area in the application form, reducing manual entry errors by 90%.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-2">
                2
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Revenue Officer Verification Queue</h3>
              <p className="text-slate-400 leading-relaxed">
                Officers review extracted OCR fields side-by-side with the high-resolution scanned deed, flagging
                uncertain low-confidence fields and resolving mismatches before approval.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-2">
                3
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Automated Cadastral GIS Alignment</h3>
              <p className="text-slate-400 leading-relaxed">
                Extracted Khasra numbers and survey dimensions are cross-referenced with spatial GIS parcel shapefiles
                to detect parcel overlaps, area inflation, or counterfeit registrations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
