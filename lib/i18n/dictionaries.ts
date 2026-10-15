export type Lang = "en" | "hi" | "mr" | "kn";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

type Dict = Record<string, string>;

/**
 * English is the complete source dictionary.
 * hi / mr / kn are interface-text drafts (navigation, buttons, safety banner).
 * They have NOT had professional clinical or linguistic review. Any key missing
 * from a non-English dictionary falls back to English and the UI says so.
 */
const en: Dict = {
  "nav.explore": "Explore",
  "nav.anatomy": "Anatomy",
  "nav.care": "Care guidance",
  "nav.firstAid": "First aid",
  "nav.reports": "Reports",
  "nav.medicines": "Medicines",
  "nav.doctors": "Doctors",
  "nav.assistant": "Assistant",
  "nav.dashboard": "Dashboard",
  "nav.menu": "Menu",
  "nav.language": "Language",
  "hero.title": "Your health. Better understood.",
  "hero.body":
    "Understand your health information, explore the human body, learn essential care skills, and find your next step with Swasth Setu.",
  "hero.cta1": "Explore Your Health",
  "hero.cta2": "Explore the Human Body",
  "safety.banner":
    "Swasth Setu is for education only. It does not diagnose or treat. In an emergency call 112 (India) or your local emergency number.",
  "safety.learn": "Read safety information",
  "lang.fallback":
    "Some text on this page is not yet available in the selected language and is shown in English.",
  "common.demo": "Demo data",
  "common.search": "Search",
  "common.reset": "Reset",
  "common.delete": "Delete",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.submit": "Submit",
};

const hi: Dict = {
  "nav.explore": "खोजें",
  "nav.anatomy": "शरीर रचना",
  "nav.care": "देखभाल मार्गदर्शन",
  "nav.firstAid": "प्राथमिक उपचार",
  "nav.reports": "रिपोर्ट",
  "nav.medicines": "दवाइयाँ",
  "nav.doctors": "डॉक्टर",
  "nav.assistant": "सहायक",
  "nav.dashboard": "डैशबोर्ड",
  "nav.menu": "मेनू",
  "nav.language": "भाषा",
  "hero.title": "आपका स्वास्थ्य। बेहतर समझ के साथ।",
  "hero.body":
    "अपनी स्वास्थ्य जानकारी समझें, मानव शरीर को जानें, ज़रूरी देखभाल कौशल सीखें और स्वस्थ सेतु के साथ अपना अगला कदम खोजें।",
  "hero.cta1": "अपना स्वास्थ्य जानें",
  "hero.cta2": "मानव शरीर देखें",
  "safety.banner":
    "स्वस्थ सेतु केवल शिक्षा के लिए है। यह निदान या इलाज नहीं करता। आपात स्थिति में 112 (भारत) या अपने स्थानीय आपातकालीन नंबर पर कॉल करें।",
  "safety.learn": "सुरक्षा जानकारी पढ़ें",
  "lang.fallback":
    "इस पृष्ठ का कुछ पाठ चुनी हुई भाषा में अभी उपलब्ध नहीं है और अंग्रेज़ी में दिखाया गया है।",
  "common.demo": "डेमो डेटा",
  "common.search": "खोजें",
  "common.reset": "रीसेट",
  "common.delete": "हटाएँ",
  "common.save": "सहेजें",
  "common.cancel": "रद्द करें",
  "common.submit": "जमा करें",
};

const mr: Dict = {
  "nav.explore": "शोधा",
  "nav.anatomy": "शरीररचना",
  "nav.care": "काळजी मार्गदर्शन",
  "nav.firstAid": "प्रथमोपचार",
  "nav.reports": "अहवाल",
  "nav.medicines": "औषधे",
  "nav.doctors": "डॉक्टर",
  "nav.assistant": "सहाय्यक",
  "nav.dashboard": "डॅशबोर्ड",
  "nav.menu": "मेनू",
  "nav.language": "भाषा",
  "hero.title": "तुमचे आरोग्य. अधिक चांगले समजून.",
  "hero.body":
    "तुमची आरोग्य माहिती समजून घ्या, मानवी शरीर जाणून घ्या, आवश्यक काळजीची कौशल्ये शिका आणि स्वस्थ सेतूसोबत पुढचे पाऊल शोधा.",
  "hero.cta1": "तुमचे आरोग्य जाणून घ्या",
  "hero.cta2": "मानवी शरीर पहा",
  "safety.banner":
    "स्वस्थ सेतू फक्त शिक्षणासाठी आहे. ते निदान किंवा उपचार करत नाही. आणीबाणीत 112 (भारत) किंवा तुमच्या स्थानिक आपत्कालीन क्रमांकावर कॉल करा.",
  "safety.learn": "सुरक्षितता माहिती वाचा",
  "common.search": "शोधा",
  "common.reset": "रीसेट",
  "common.delete": "हटवा",
  "common.save": "जतन करा",
  "common.cancel": "रद्द करा",
};

const kn: Dict = {
  "nav.explore": "ಅನ್ವೇಷಿಸಿ",
  "nav.anatomy": "ಶರೀರ ರಚನೆ",
  "nav.care": "ಆರೈಕೆ ಮಾರ್ಗದರ್ಶನ",
  "nav.firstAid": "ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ",
  "nav.reports": "ವರದಿಗಳು",
  "nav.medicines": "ಔಷಧಗಳು",
  "nav.doctors": "ವೈದ್ಯರು",
  "nav.assistant": "ಸಹಾಯಕ",
  "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  "nav.menu": "ಮೆನು",
  "nav.language": "ಭಾಷೆ",
  "hero.title": "ನಿಮ್ಮ ಆರೋಗ್ಯ. ಉತ್ತಮ ತಿಳುವಳಿಕೆಯೊಂದಿಗೆ.",
  "hero.body":
    "ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ, ಮಾನವ ದೇಹವನ್ನು ಅನ್ವೇಷಿಸಿ, ಅಗತ್ಯ ಆರೈಕೆ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಯಿರಿ ಮತ್ತು ಸ್ವಸ್ಥ ಸೇತು ಜೊತೆ ಮುಂದಿನ ಹೆಜ್ಜೆ ಕಂಡುಕೊಳ್ಳಿ.",
  "hero.cta1": "ನಿಮ್ಮ ಆರೋಗ್ಯ ಅನ್ವೇಷಿಸಿ",
  "hero.cta2": "ಮಾನವ ದೇಹ ಅನ್ವೇಷಿಸಿ",
  "safety.banner":
    "ಸ್ವಸ್ಥ ಸೇತು ಶಿಕ್ಷಣಕ್ಕಾಗಿ ಮಾತ್ರ. ಇದು ರೋಗನಿರ್ಣಯ ಅಥವಾ ಚಿಕಿತ್ಸೆ ಮಾಡುವುದಿಲ್ಲ. ತುರ್ತು ಸ್ಥಿತಿಯಲ್ಲಿ 112 (ಭಾರತ) ಅಥವಾ ನಿಮ್ಮ ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ.",
  "safety.learn": "ಸುರಕ್ಷತಾ ಮಾಹಿತಿ ಓದಿ",
  "common.search": "ಹುಡುಕಿ",
  "common.reset": "ಮರುಹೊಂದಿಸಿ",
  "common.delete": "ಅಳಿಸಿ",
  "common.save": "ಉಳಿಸಿ",
  "common.cancel": "ರದ್ದುಮಾಡಿ",
};

export const dictionaries: Record<Lang, Dict> = { en, hi, mr, kn };

/** Returns the translation, or null when the key is missing for this language. */
export function lookup(lang: Lang, key: string): string | null {
  return dictionaries[lang][key] ?? null;
}
