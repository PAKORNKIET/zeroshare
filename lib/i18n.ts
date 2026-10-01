export const LOCALES = ['th', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = 'lang';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

const en = {
  // Navigation + chrome
  'nav.home': 'Home',
  'nav.qr': 'QR generator',
  'nav.file': 'File share',
  'nav.quick': 'Quick Drop',
  'nav.dashboard': 'Dashboard',
  'nav.account': 'Account',
  'tab.home': 'Home',
  'tab.qr': 'QR',
  'tab.file': 'Files',
  'tab.quick': 'Drop',
  'tab.dashboard': 'Mine',
  'footer.links': 'About · Privacy · Terms · Contact',
  'pref.language': 'Language',
  'pref.switchLanguage': 'เปลี่ยนเป็นภาษาไทย',
  'pref.dark': 'Dark mode',
  'pref.light': 'Light mode',
  'brand.home': 'Zero Share home',

  // Shared
  'common.copyLink': 'Copy link',
  'common.qrAlt': 'QR code',
  'common.permanent': 'Permanent',
  'common.expires': 'Expires {date}',
  'common.expired': 'Expired',
  'common.loading': 'Loading…',
  'common.download': 'Download',
  'common.somethingWrong': 'Something went wrong.',
  'common.chooseFile': 'Choose a file first',
  'common.uploading': 'Uploading…',
  'common.oneTimeTag': ' · one-time download',
  'err.startUpload': 'Could not start the upload.',
  'err.storageUpload': 'Upload to storage failed.',
  'exp.permanent': 'Permanent',
  'exp.1h': '1 hour',
  'exp.6h': '6 hours',
  'exp.12h': '12 hours',
  'exp.24h': '24 hours',
  'exp.3d': '3 days',
  'exp.7d': '7 days',
  'exp.30d': '30 days',
  'exp.custom': 'Custom date',

  // Home
  'home.title': 'Share a file or a link',
  'home.sub': 'No account needed. Everything you share here expires and is removed on its own.',
  'home.quick.title': 'Quick Drop',
  'home.quick.desc': 'Upload a file and get a link plus QR code that lasts 24 hours.',
  'home.direct.title': 'Direct send',
  'home.direct.desc': 'Send a file straight to another phone or computer. Nothing is uploaded.',
  'home.link.title': 'Share link',
  'home.link.desc': 'Upload with a password, a download limit, or your own expiry.',
  'home.qr.title': 'QR code',
  'home.qr.desc': 'Turn any link into a code people can scan.',

  // File share
  'file.title': 'File sharing',
  'file.sub': 'Send straight to one device, or upload and get a link anyone can open.',
  'file.tab.direct': 'Direct send',
  'file.tab.link': 'Share link',
  'direct.howTitle': 'What is direct send?',
  'direct.step1': 'Choose a file and create a room.',
  'direct.step2': 'On the other device, scan the QR code or open the link.',
  'direct.step3': 'The file goes straight from this browser to theirs. It is never uploaded to our servers.',
  'direct.keepOpen': 'Keep this page open on both devices until the transfer finishes.',
  'direct.fileLabel': 'File to send',
  'direct.create': 'Create room',
  'direct.roomQrAlt': 'Room QR code',
  'direct.waiting': 'Waiting for the other device to open this link…',
  'direct.connected': 'Connected — starting transfer…',
  'direct.sending': 'Sending… {pct}%',
  'direct.sent': 'Transfer complete.',
  'direct.close': 'Close room',
  'link.file': 'File',
  'link.expires': 'Link expires',
  'link.limit': 'Download limit',
  'link.unlimited': 'Unlimited',
  'link.requirePassword': 'Require a password',
  'link.password': 'Password',
  'link.oneTime': 'One-time download — link dies after the first open',
  'link.generate': 'Generate link + QR',
  'link.cappedAt': ' · capped at {n} downloads',
  'link.passwordTag': ' · password protected',

  // QR generator
  'qr.title': 'QR generator',
  'qr.sub': 'Turn a link, a file, or a destination you can update later into a scannable code.',
  'qr.type.url': 'URL',
  'qr.type.file': 'File',
  'qr.type.dynamic': 'Dynamic',
  'qr.dynamicNote':
    'The printed code always points to the same short URL — change the destination anytime without reprinting.',
  'qr.fileRef': 'File name or reference',
  'qr.destination': 'Destination',
  'qr.expires': 'Expires',
  'qr.expiryDate': 'Expiry date',
  'qr.generate': 'Generate QR',
  'qr.generating': 'Generating…',
  'qr.enterDestination': 'Enter a destination first',
  'qr.failed': 'Could not generate the QR code.',
  'qr.codeExpired': 'This code has expired.',
  'qr.codeMissing': 'This code does not exist.',
  'qr.goneSub': 'The QR code may have been removed, or reached its expiry date.',

  // Quick Drop
  'quick.title': 'Quick Drop',
  'quick.sub': 'The fastest path from file to link. Drop it, get a code, done.',
  'quick.drag': 'Drag a file here',
  'quick.select': 'Select file',
  'quick.scan': 'Scan to download · expires in 24 hours',

  // Dashboard
  'dash.title': 'Dashboard',
  'dash.guest':
    'You’re browsing as a guest — everything on Zero Share works without an account. Sign in to keep track of what you’ve shared.',
  'dash.login': 'Log in',
  'dash.signedInAs': 'Signed in as {email}',
  'dash.qrCount': 'QR codes',
  'dash.filesShared': 'Files shared',
  'dash.downloads': 'Total downloads',
  'dash.myQr': 'My QR codes',
  'dash.noQr': 'Nothing yet. Codes you create while signed in show up here.',
  'dash.myFiles': 'My files',
  'dash.noFiles': 'Nothing yet. Files you share while signed in show up here.',
  'col.code': 'Code',
  'col.type': 'Type',
  'col.destination': 'Destination',
  'col.expires': 'Expires',
  'col.file': 'File',
  'col.size': 'Size',
  'col.downloads': 'Downloads',

  // Account
  'login.account': 'Account',
  'login.signOut': 'Sign out',
  'login.signingOut': 'Signing out…',
  'login.titleIn': 'Log in',
  'login.titleUp': 'Create an account',
  'login.sub': 'Signing in lets you track the QR codes and files you’ve shared. Guest use never requires this.',
  'login.tabIn': 'Log in',
  'login.tabUp': 'Sign up',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.passwordHint': 'At least 6 characters',
  'login.wait': 'Please wait…',
  'login.create': 'Create account',
  'login.created': 'Account created. Check your email to confirm, then sign in.',

  // Download page
  'dl.expired': 'This link has expired.',
  'dl.missing': 'This link does not exist.',
  'dl.goneSub': 'The file may have been removed, or the link reached its expiry or download limit.',
  'dl.passwordRequired': 'This file is password protected',
  'dl.passwordPlaceholder': 'Enter password',
  'dl.preparing': 'Preparing download…',
  'dl.failed': 'Could not start the download.',
  'dl.started': 'Your download has started',
  'dl.startedSub': 'If nothing happened, check your browser’s download prompt or pop-up blocker.',

  // Receiving room
  'room.connecting': 'Connecting to the sender…',
  'room.connected': 'Connected. Waiting for the file…',
  'room.keepOpen': 'Keep this page open — the file is coming straight from the sender’s device.',
  'room.received': '{size} received',
  'room.failed': 'Connection failed',

  // File picker
  'picker.choose': 'Choose file',
  'picker.none': 'No file chosen',

  // Ads
  'ad.placeholder': 'Advertisement space — {placement}',
} as const;

export type MessageKey = keyof typeof en;

const th: Record<MessageKey, string> = {
  'nav.home': 'หน้าแรก',
  'nav.qr': 'สร้าง QR',
  'nav.file': 'แชร์ไฟล์',
  'nav.quick': 'ฝากไฟล์ด่วน',
  'nav.dashboard': 'แดชบอร์ด',
  'nav.account': 'บัญชี',
  'tab.home': 'หน้าแรก',
  'tab.qr': 'QR',
  'tab.file': 'ไฟล์',
  'tab.quick': 'ด่วน',
  'tab.dashboard': 'ของฉัน',
  'footer.links': 'เกี่ยวกับ · ความเป็นส่วนตัว · ข้อกำหนด · ติดต่อ',
  'pref.language': 'ภาษา',
  'pref.switchLanguage': 'Switch to English',
  'pref.dark': 'โหมดมืด',
  'pref.light': 'โหมดสว่าง',
  'brand.home': 'หน้าแรก Zero Share',

  'common.copyLink': 'คัดลอกลิงก์',
  'common.qrAlt': 'QR โค้ด',
  'common.permanent': 'ไม่มีวันหมดอายุ',
  'common.expires': 'หมดอายุ {date}',
  'common.expired': 'หมดอายุแล้ว',
  'common.loading': 'กำลังโหลด…',
  'common.download': 'ดาวน์โหลด',
  'common.somethingWrong': 'เกิดข้อผิดพลาด',
  'common.chooseFile': 'เลือกไฟล์ก่อน',
  'common.uploading': 'กำลังอัปโหลด…',
  'common.oneTimeTag': ' · ดาวน์โหลดได้ครั้งเดียว',
  'err.startUpload': 'เริ่มอัปโหลดไม่สำเร็จ',
  'err.storageUpload': 'อัปโหลดไฟล์ไม่สำเร็จ',
  'exp.permanent': 'ไม่มีวันหมดอายุ',
  'exp.1h': '1 ชั่วโมง',
  'exp.6h': '6 ชั่วโมง',
  'exp.12h': '12 ชั่วโมง',
  'exp.24h': '24 ชั่วโมง',
  'exp.3d': '3 วัน',
  'exp.7d': '7 วัน',
  'exp.30d': '30 วัน',
  'exp.custom': 'กำหนดวันเอง',

  'home.title': 'ส่งไฟล์หรือลิงก์',
  'home.sub': 'ไม่ต้องสมัครสมาชิก ทุกอย่างที่แชร์ที่นี่จะหมดอายุและถูกลบเอง',
  'home.quick.title': 'ฝากไฟล์ด่วน',
  'home.quick.desc': 'อัปโหลดไฟล์ แล้วได้ลิงก์กับ QR โค้ดที่ใช้ได้ 24 ชั่วโมง',
  'home.direct.title': 'ส่งตรงถึงเครื่อง',
  'home.direct.desc': 'ส่งไฟล์ไปยังมือถือหรือคอมอีกเครื่องโดยตรง ไม่มีการอัปโหลด',
  'home.link.title': 'ลิงก์ชั่วคราว',
  'home.link.desc': 'อัปโหลดพร้อมตั้งรหัสผ่าน จำกัดจำนวนดาวน์โหลด หรือกำหนดวันหมดอายุ',
  'home.qr.title': 'QR โค้ด',
  'home.qr.desc': 'เปลี่ยนลิงก์ใดก็ได้ให้เป็นโค้ดที่สแกนได้',

  'file.title': 'แชร์ไฟล์',
  'file.sub': 'ส่งตรงไปยังอีกเครื่อง หรืออัปโหลดเพื่อรับลิงก์ที่ใครก็เปิดได้',
  'file.tab.direct': 'ส่งตรงถึงเครื่อง',
  'file.tab.link': 'ลิงก์ชั่วคราว',
  'direct.howTitle': 'ส่งตรงถึงเครื่องคืออะไร?',
  'direct.step1': 'เลือกไฟล์แล้วกดสร้างห้อง',
  'direct.step2': 'ที่อีกเครื่อง สแกน QR โค้ดหรือเปิดลิงก์',
  'direct.step3': 'ไฟล์จะส่งจากเบราว์เซอร์นี้ไปยังอีกเครื่องโดยตรง ไม่ถูกอัปโหลดขึ้นเซิร์ฟเวอร์ของเรา',
  'direct.keepOpen': 'เปิดหน้านี้ค้างไว้ทั้งสองเครื่องจนกว่าจะส่งเสร็จ',
  'direct.fileLabel': 'ไฟล์ที่จะส่ง',
  'direct.create': 'สร้างห้อง',
  'direct.roomQrAlt': 'QR โค้ดของห้อง',
  'direct.waiting': 'รออีกเครื่องเปิดลิงก์นี้…',
  'direct.connected': 'เชื่อมต่อแล้ว กำลังเริ่มส่ง…',
  'direct.sending': 'กำลังส่ง… {pct}%',
  'direct.sent': 'ส่งเสร็จแล้ว',
  'direct.close': 'ปิดห้อง',
  'link.file': 'ไฟล์',
  'link.expires': 'ลิงก์หมดอายุใน',
  'link.limit': 'จำกัดจำนวนดาวน์โหลด',
  'link.unlimited': 'ไม่จำกัด',
  'link.requirePassword': 'ตั้งรหัสผ่าน',
  'link.password': 'รหัสผ่าน',
  'link.oneTime': 'ดาวน์โหลดได้ครั้งเดียว — ลิงก์จะใช้ไม่ได้หลังเปิดครั้งแรก',
  'link.generate': 'สร้างลิงก์ + QR',
  'link.cappedAt': ' · ดาวน์โหลดได้ {n} ครั้ง',
  'link.passwordTag': ' · มีรหัสผ่าน',

  'qr.title': 'สร้าง QR โค้ด',
  'qr.sub': 'เปลี่ยนลิงก์ ไฟล์ หรือปลายทางที่แก้ไขภายหลังได้ ให้เป็นโค้ดที่สแกนได้',
  'qr.type.url': 'ลิงก์',
  'qr.type.file': 'ไฟล์',
  'qr.type.dynamic': 'แก้ไขได้',
  'qr.dynamicNote': 'โค้ดที่พิมพ์ออกไปแล้วจะชี้ไปที่ลิงก์สั้นเดิมเสมอ เปลี่ยนปลายทางได้ตลอดโดยไม่ต้องพิมพ์ใหม่',
  'qr.fileRef': 'ชื่อไฟล์หรือข้อมูลอ้างอิง',
  'qr.destination': 'ปลายทาง',
  'qr.expires': 'หมดอายุ',
  'qr.expiryDate': 'วันหมดอายุ',
  'qr.generate': 'สร้าง QR',
  'qr.generating': 'กำลังสร้าง…',
  'qr.enterDestination': 'ใส่ปลายทางก่อน',
  'qr.failed': 'สร้าง QR โค้ดไม่สำเร็จ',
  'qr.codeExpired': 'โค้ดนี้หมดอายุแล้ว',
  'qr.codeMissing': 'ไม่พบโค้ดนี้',
  'qr.goneSub': 'QR โค้ดนี้อาจถูกลบไปแล้ว หรือถึงวันหมดอายุ',

  'quick.title': 'ฝากไฟล์ด่วน',
  'quick.sub': 'จากไฟล์เป็นลิงก์ได้เร็วที่สุด วางไฟล์ รับโค้ด จบ',
  'quick.drag': 'ลากไฟล์มาวางที่นี่',
  'quick.select': 'เลือกไฟล์',
  'quick.scan': 'สแกนเพื่อดาวน์โหลด · หมดอายุใน 24 ชั่วโมง',

  'dash.title': 'แดชบอร์ด',
  'dash.guest':
    'ตอนนี้ใช้งานแบบไม่ได้เข้าสู่ระบบ ทุกฟีเจอร์ใช้ได้โดยไม่ต้องมีบัญชี เข้าสู่ระบบเพื่อดูประวัติสิ่งที่เคยแชร์',
  'dash.login': 'เข้าสู่ระบบ',
  'dash.signedInAs': 'เข้าสู่ระบบในชื่อ {email}',
  'dash.qrCount': 'QR โค้ด',
  'dash.filesShared': 'ไฟล์ที่แชร์',
  'dash.downloads': 'ดาวน์โหลดทั้งหมด',
  'dash.myQr': 'QR โค้ดของฉัน',
  'dash.noQr': 'ยังไม่มี QR โค้ดที่สร้างตอนเข้าสู่ระบบจะแสดงที่นี่',
  'dash.myFiles': 'ไฟล์ของฉัน',
  'dash.noFiles': 'ยังไม่มี ไฟล์ที่แชร์ตอนเข้าสู่ระบบจะแสดงที่นี่',
  'col.code': 'โค้ด',
  'col.type': 'ประเภท',
  'col.destination': 'ปลายทาง',
  'col.expires': 'หมดอายุ',
  'col.file': 'ไฟล์',
  'col.size': 'ขนาด',
  'col.downloads': 'ดาวน์โหลด',

  'login.account': 'บัญชี',
  'login.signOut': 'ออกจากระบบ',
  'login.signingOut': 'กำลังออกจากระบบ…',
  'login.titleIn': 'เข้าสู่ระบบ',
  'login.titleUp': 'สร้างบัญชี',
  'login.sub': 'เข้าสู่ระบบเพื่อดูประวัติ QR โค้ดและไฟล์ที่เคยแชร์ ใช้งานโดยไม่เข้าสู่ระบบก็ได้เสมอ',
  'login.tabIn': 'เข้าสู่ระบบ',
  'login.tabUp': 'สมัครสมาชิก',
  'login.email': 'อีเมล',
  'login.password': 'รหัสผ่าน',
  'login.passwordHint': 'อย่างน้อย 6 ตัวอักษร',
  'login.wait': 'กรุณารอสักครู่…',
  'login.create': 'สร้างบัญชี',
  'login.created': 'สร้างบัญชีแล้ว ตรวจอีเมลเพื่อยืนยัน แล้วเข้าสู่ระบบ',

  'dl.expired': 'ลิงก์นี้หมดอายุแล้ว',
  'dl.missing': 'ไม่พบลิงก์นี้',
  'dl.goneSub': 'ไฟล์อาจถูกลบไปแล้ว หรือลิงก์หมดอายุหรือครบจำนวนดาวน์โหลดแล้ว',
  'dl.passwordRequired': 'ไฟล์นี้มีรหัสผ่าน',
  'dl.passwordPlaceholder': 'ใส่รหัสผ่าน',
  'dl.preparing': 'กำลังเตรียมดาวน์โหลด…',
  'dl.failed': 'เริ่มดาวน์โหลดไม่สำเร็จ',
  'dl.started': 'เริ่มดาวน์โหลดแล้ว',
  'dl.startedSub': 'ถ้าไม่มีอะไรเกิดขึ้น ลองดูการแจ้งเตือนดาวน์โหลดหรือตัวบล็อกป๊อปอัปของเบราว์เซอร์',

  'room.connecting': 'กำลังเชื่อมต่อกับผู้ส่ง…',
  'room.connected': 'เชื่อมต่อแล้ว รอรับไฟล์…',
  'room.keepOpen': 'เปิดหน้านี้ค้างไว้ ไฟล์กำลังส่งตรงมาจากเครื่องของผู้ส่ง',
  'room.received': 'ได้รับแล้ว {size}',
  'room.failed': 'เชื่อมต่อไม่สำเร็จ',

  'picker.choose': 'เลือกไฟล์',
  'picker.none': 'ยังไม่ได้เลือกไฟล์',

  'ad.placeholder': 'พื้นที่โฆษณา — {placement}',
};

const messages: Record<Locale, Record<MessageKey, string>> = { en, th };

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function createTranslator(locale: Locale): Translate {
  const dict = messages[locale];
  return (key, vars) => {
    let text = dict[key] ?? en[key];
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

/** BCP 47 tag for date formatting in the given locale. */
export function dateLocale(locale: Locale): string {
  return locale === 'th' ? 'th-TH' : 'en-US';
}
