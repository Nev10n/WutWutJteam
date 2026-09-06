/* ==========================================================================
   BRAIN BATTLE — game logic
   Catatan: sistem akun di file ini memakai localStorage (khusus prototype
   frontend). Password disimpan apa adanya (tanpa hashing) — cukup untuk
   demo lokal, JANGAN dipakai untuk produksi sungguhan tanpa backend & hashing.
   ========================================================================== */

/* ==========================================================================
   AUTO-GENERATE SOAL (digabung dari soal-generator.js)
   MTK/FSK/KIM: dihitung dari rumus + angka acak (selalu beda tiap match).
   BIO/BID/BEN/PUM/GEO/SOS: diacak dari bank fakta per tingkat kesulitan.
   Kesulitan mengikuti rank pemain lewat getDifficultyFromRank().
   ========================================================================== */
function sgRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sgPick(arr) {
  return arr[sgRandInt(0, arr.length - 1)];
}
function sgShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = sgRandInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// correctValue: number -> hasil: [optionsString(4), correctValueAsString]
function numericOptions(correctValue, spread) {
  const options = new Set([correctValue]);
  let guard = 0;
  while (options.size < 4 && guard < 50) {
    guard++;
    const delta = sgRandInt(-spread, spread) || 1;
    options.add(correctValue + delta);
  }
  return { options: Array.from(options).map(String), correctText: String(correctValue) };
}

function factOptions(correctText, distractors) {
  return sgShuffle([correctText, ...sgShuffle(distractors).slice(0, 3)]);
}

/* ---------------- Rank -> tingkat kesulitan ---------------- */
const RANK_TO_DIFFICULTY = [
  { keyword: "NOVICE", difficulty: "mudah" },
  { keyword: "SCHOLAR", difficulty: "mudah" },
  { keyword: "EXPERT", difficulty: "sedang" },
  { keyword: "ELITE", difficulty: "sedang" },
  { keyword: "MASTER", difficulty: "sulit" },
  { keyword: "GRAND SCHOLAR", difficulty: "sulit" },
  { keyword: "ACADEMIC LEGEND", difficulty: "sulit" },
];
function getDifficultyFromRank(rankLabel) {
  if (!rankLabel) return "mudah";
  const upper = rankLabel.toUpperCase();
  const sorted = [...RANK_TO_DIFFICULTY].sort((a, b) => b.keyword.length - a.keyword.length);
  const match = sorted.find((r) => upper.includes(r.keyword));
  return match ? match.difficulty : "mudah";
}

/* ---------------- MTK ---------------- */
function generateMTK(difficulty) {
  if (difficulty === "mudah") {
    const a = sgRandInt(1, 20), b = sgRandInt(1, 20), op = sgPick(["+", "-"]);
    const correct = op === "+" ? a + b : a - b;
    const { options, correctText } = numericOptions(correct, 5);
    return [`${a} ${op} ${b} = ?`, correctText, options];
  }
  if (difficulty === "sedang") {
    const a = sgRandInt(2, 12), b = sgRandInt(2, 12), op = sgPick(["×", "÷"]);
    let text, correct;
    if (op === "×") { correct = a * b; text = `${a} × ${b} = ?`; }
    else { correct = a; text = `${a * b} ÷ ${b} = ?`; }
    const { options, correctText } = numericOptions(correct, 6);
    return [text, correctText, options];
  }
  const type = sgPick(["aljabar", "persen"]);
  if (type === "aljabar") {
    const x = sgRandInt(2, 15), a = sgRandInt(2, 9), b = sgRandInt(1, 20);
    const hasil = a * x + b;
    const { options, correctText } = numericOptions(x, 4);
    return [`Jika ${a}x + ${b} = ${hasil}, maka nilai x adalah...`, correctText, options];
  }
  const total = sgPick([50, 80, 120, 200, 250, 400]);
  const persen = sgPick([10, 20, 25, 40, 50]);
  const correct = (total * persen) / 100;
  const { options, correctText } = numericOptions(correct, Math.max(5, correct * 0.2));
  return [`${persen}% dari ${total} adalah...`, correctText, options];
}

/* ---------------- FSK ---------------- */
function generateFSK(difficulty) {
  if (difficulty === "mudah") {
    const jarak = sgRandInt(20, 200), waktu = sgPick([2, 4, 5, 10]);
    const correct = jarak / waktu;
    const { options, correctText } = numericOptions(correct, 5);
    return [`Sebuah mobil menempuh jarak ${jarak} m dalam waktu ${waktu} detik. Kecepatannya (m/s) adalah...`, correctText, options];
  }
  if (difficulty === "sedang") {
    const massa = sgRandInt(2, 20), percepatan = sgRandInt(1, 10);
    const correct = massa * percepatan;
    const { options, correctText } = numericOptions(correct, 8);
    return [`Benda bermassa ${massa} kg mendapat percepatan ${percepatan} m/s². Gaya (F=m×a) dalam Newton adalah...`, correctText, options];
  }
  const massa = sgRandInt(2, 10), kecepatan = sgRandInt(2, 10);
  const correct = 0.5 * massa * kecepatan * kecepatan;
  const { options, correctText } = numericOptions(correct, Math.max(10, correct * 0.2));
  return [`Energi kinetik (Ek=½mv²) benda bermassa ${massa} kg berkecepatan ${kecepatan} m/s adalah...`, correctText, options];
}

/* ---------------- KIM ---------------- */
const UNSUR = [
  { nama: "Hidrogen", simbol: "H", ar: 1 },
  { nama: "Karbon", simbol: "C", ar: 12 },
  { nama: "Nitrogen", simbol: "N", ar: 14 },
  { nama: "Oksigen", simbol: "O", ar: 16 },
  { nama: "Natrium", simbol: "Na", ar: 23 },
  { nama: "Magnesium", simbol: "Mg", ar: 24 },
  { nama: "Sulfur", simbol: "S", ar: 32 },
  { nama: "Klorin", simbol: "Cl", ar: 35.5 },
  { nama: "Kalsium", simbol: "Ca", ar: 40 },
];
function generateKIM(difficulty) {
  if (difficulty === "mudah") {
    const u = sgPick(UNSUR);
    const options = factOptions(u.simbol, sgShuffle(UNSUR.filter((x) => x.simbol !== u.simbol)).slice(0, 3).map((x) => x.simbol));
    return [`Apa simbol kimia dari unsur ${u.nama}?`, u.simbol, options];
  }
  if (difficulty === "sedang") {
    const a = sgPick(UNSUR), b = sgPick(UNSUR.filter((x) => x.simbol !== a.simbol));
    const jumlahA = sgRandInt(1, 2), jumlahB = sgRandInt(1, 2);
    const correct = a.ar * jumlahA + b.ar * jumlahB;
    const rumus = `${a.simbol}${jumlahA > 1 ? jumlahA : ""}${b.simbol}${jumlahB > 1 ? jumlahB : ""}`;
    const { options, correctText } = numericOptions(correct, 6);
    return [`Diketahui Ar ${a.simbol}=${a.ar} dan Ar ${b.simbol}=${b.ar}. Mr senyawa ${rumus} adalah...`, correctText, options];
  }
  const massa = sgRandInt(10, 100), mr = sgPick([18, 44, 58, 60, 98]);
  const correct = Math.round((massa / mr) * 100) / 100;
  const { options, correctText } = numericOptions(correct, Math.max(1, correct * 0.3));
  return [`Jumlah mol dari ${massa} gram zat dengan Mr=${mr} (n=massa/Mr, 2 desimal) adalah...`, correctText, options];
}

/* ---------------- Bank fakta: BIO, BID, BEN, PUM, GEO, SOS ---------------- */
const FACT_BANK = {
  BIO: {
    mudah: [
      ["Organ yang berfungsi memompa darah adalah?", "Jantung", ["Hati", "Ginjal", "Paru-paru"]],
      ["Tumbuhan menghasilkan makanan melalui proses?", "Fotosintesis", ["Respirasi", "Transpirasi", "Fermentasi"]],
      ["Bagian tubuh yang digunakan untuk bernapas adalah?", "Paru-paru", ["Jantung", "Usus", "Ginjal"]],
      ["Hewan yang berkembang biak dengan bertelur disebut?", "Ovipar", ["Vivipar", "Ovovivipar", "Membelah diri"]],
      ["Bagian sel tumbuhan yang tidak dimiliki sel hewan adalah?", "Dinding sel", ["Nukleus", "Membran sel", "Sitoplasma"]],
      ["Alat gerak pada ikan untuk berenang adalah?", "Sirip", ["Insang", "Sisik", "Ekor saja"]],
      ["Bagian bunga yang berfungsi sebagai alat kelamin jantan adalah?", "Benang sari", ["Putik", "Mahkota", "Kelopak"]],
      ["Proses pengeluaran keringat termasuk sistem?", "Ekskresi", ["Pencernaan", "Peredaran darah", "Pernapasan"]],
      ["Hewan yang menyusui anaknya disebut kelompok?", "Mamalia", ["Reptil", "Aves", "Amfibi"]],
      ["Gigi yang berfungsi memotong makanan adalah gigi?", "Seri", ["Taring", "Geraham", "Susu"]],
    ],
    sedang: [
      ["Pertukaran oksigen & CO2 di paru-paru terjadi di?", "Alveolus", ["Bronkus", "Trakea", "Laring"]],
      ["Enzim pemecah karbohidrat di mulut adalah?", "Amilase", ["Pepsin", "Lipase", "Tripsin"]],
      ["Bagian sel pusat pengatur aktivitas sel adalah?", "Nukleus", ["Mitokondria", "Ribosom", "Vakuola"]],
      ["Hormon pengatur kadar gula darah adalah?", "Insulin", ["Adrenalin", "Tiroksin", "Estrogen"]],
      ["Pembuluh darah yang membawa darah dari jantung disebut?", "Arteri", ["Vena", "Kapiler", "Aorta saja"]],
      ["Bagian otak yang mengatur keseimbangan tubuh adalah?", "Otak kecil (serebelum)", ["Otak besar", "Sumsum lanjutan", "Batang otak"]],
      ["Proses penyaringan darah terjadi di organ?", "Ginjal", ["Hati", "Limpa", "Pankreas"]],
    ],
    sulit: [
      ["Pembelahan sel yang hasilnya berkromosom setengah induk disebut?", "Meiosis", ["Mitosis", "Sitokinesis", "Interfase"]],
      ["Tahap respirasi seluler penghasil ATP terbanyak adalah?", "Rantai transpor elektron", ["Glikolisis", "Siklus Krebs", "Fermentasi"]],
      ["Organel yang berperan dalam sintesis protein adalah?", "Ribosom", ["Lisosom", "Badan Golgi", "Peroksisom"]],
      ["Persilangan monohibrid dominan penuh menghasilkan rasio fenotipe F2 sebesar?", "3:1", ["1:1", "1:2:1", "9:3:3:1"]],
      ["Proses fotosintesis yang menghasilkan oksigen terjadi pada tahap?", "Reaksi terang", ["Reaksi gelap", "Siklus Calvin", "Fiksasi karbon"]],
    ],
  },
  BID: {
    mudah: [
      ["Sinonim dari kata 'senang' adalah?", "Gembira", ["Sedih", "Marah", "Takut"]],
      ["Antonim dari kata 'besar' adalah?", "Kecil", ["Tinggi", "Panjang", "Luas"]],
      ["Kata dasar dari 'menuliskan' adalah?", "Tulis", ["Tulisan", "Menulis", "Tertulis"]],
      ["Kalimat tanya biasanya diakhiri dengan tanda?", "Tanya (?)", ["Titik (.)", "Seru (!)", "Koma (,)"]],
      ["Antonim dari kata 'rajin' adalah?", "Malas", ["Giat", "Tekun", "Cekatan"]],
      ["Kata baku untuk 'apotik' adalah?", "Apotek", ["Apotik", "Apotheek", "Aphotek"]],
      ["Jenis kata yang menerangkan kata benda disebut kata?", "Sifat", ["Kerja", "Ganti", "Keterangan"]],
    ],
    sedang: [
      ["Jenis karangan yang menggambarkan sesuatu secara rinci disebut?", "Deskripsi", ["Narasi", "Eksposisi", "Argumentasi"]],
      ["Sinonim dari kata 'cepat' adalah?", "Lekas", ["Lambat", "Diam", "Berhenti"]],
      ["Kata baku yang benar adalah?", "Risiko", ["Resiko", "Risikko", "Riziko"]],
      ["Teks yang berisi langkah-langkah disebut teks?", "Prosedur", ["Narasi", "Deskripsi", "Eksposisi"]],
      ["Ide pokok paragraf biasanya terdapat pada kalimat?", "Utama", ["Penjelas", "Penutup", "Tanya"]],
      ["Kalimat yang menggunakan majas personifikasi adalah 'Daun menari ditiup angin'. Majas ini menggambarkan?", "Benda mati seolah bisa bertindak seperti manusia", ["Perbandingan dua hal berbeda", "Sindiran halus", "Perbandingan berlebihan"]],
    ],
    sulit: [
      ["Majas perbandingan langsung dengan kata 'bagai'/'seperti' disebut?", "Simile", ["Metafora", "Personifikasi", "Hiperbola"]],
      ["Berikut BUKAN ciri kalimat efektif adalah?", "Bertele-tele", ["Logis", "Hemat kata", "Sepadan struktur"]],
      ["Karya sastra lama berbentuk empat baris dengan sampiran & isi disebut?", "Pantun", ["Syair", "Gurindam", "Puisi bebas"]],
      ["Kalimat yang mengandung dua klausa setara dihubungkan kata sambung disebut kalimat?", "Majemuk setara", ["Majemuk bertingkat", "Tunggal", "Elips"]],
    ],
  },
  BEN: {
    mudah: [
      ["'Book' dalam Bahasa Indonesia artinya?", "Buku", ["Meja", "Pena", "Kursi"]],
      ["Bentuk lampau dari 'go' adalah?", "Went", ["Goes", "Going", "Gone"]],
      ["'She ___ a student.' Kata yang tepat adalah?", "is", ["am", "are", "be"]],
      ["Lawan kata dari 'difficult' adalah?", "Easy", ["Hard", "Slow", "Heavy"]],
      ["Bentuk jamak yang benar dari 'child' adalah?", "Children", ["Childs", "Childes", "Childrens"]],
      ["'They ___ playing football.' Kata yang tepat adalah?", "are", ["is", "am", "be"]],
      ["Kata tanya yang menunjukkan tempat adalah?", "Where", ["What", "Who", "When"]],
    ],
    sedang: [
      ["Sinonim dari 'happy' adalah?", "Glad", ["Sad", "Angry", "Tired"]],
      ["'They ___ playing football now.' Kata yang tepat adalah?", "are", ["is", "am", "be"]],
      ["Bentuk kata benda dari 'decide' adalah?", "Decision", ["Decisive", "Deciding", "Decided"]],
      ["Bentuk lampau dari 'write' adalah?", "Wrote", ["Writed", "Written", "Writen"]],
      ["'I have ___ this movie before.' Kata yang tepat adalah?", "seen", ["saw", "see", "seeing"]],
    ],
    sulit: [
      ["Kalimat pasif dari 'She writes a letter' adalah?", "A letter is written by her.", ["A letter writes her.", "She is written a letter.", "A letter was write by her."]],
      ["Conditional sentence type 2 digunakan untuk?", "Situasi tidak nyata di masa sekarang", ["Fakta umum", "Kejadian di masa depan yang mungkin", "Kejadian masa lalu yang benar terjadi"]],
      ["Kalimat langsung 'He said, \"I am tired.\"' jika diubah ke kalimat tidak langsung menjadi?", "He said that he was tired.", ["He said that he is tired.", "He says that he was tired.", "He said I am tired."]],
    ],
  },
  PUM: {
    mudah: [
      ["Ibu kota Indonesia adalah?", "Jakarta", ["Bandung", "Surabaya", "Medan"]],
      ["Presiden pertama Indonesia adalah?", "Soekarno", ["Soeharto", "Habibie", "Megawati"]],
      ["Hari kemerdekaan Indonesia diperingati setiap tanggal?", "17 Agustus", ["1 Juni", "28 Oktober", "10 November"]],
      ["Lambang negara Indonesia adalah?", "Garuda Pancasila", ["Elang Jawa", "Komodo", "Harimau Sumatra"]],
      ["Mata uang resmi Jepang adalah?", "Yen", ["Won", "Yuan", "Ringgit"]],
      ["Organisasi kesehatan dunia disingkat?", "WHO", ["UNICEF", "UNESCO", "FIFA"]],
      ["Planet terbesar di tata surya adalah?", "Jupiter", ["Saturnus", "Bumi", "Mars"]],
    ],
    sedang: [
      ["Organisasi PBB berkantor pusat di kota?", "New York", ["London", "Paris", "Jenewa"]],
      ["Mata uang resmi Korea Selatan adalah?", "Won", ["Yen", "Yuan", "Ringgit"]],
      ["Menara Eiffel berada di kota?", "Paris", ["London", "Roma", "Berlin"]],
      ["Organisasi negara pengekspor minyak disingkat?", "OPEC", ["OECD", "ASEAN", "NATO"]],
      ["Julukan 'Negeri Sakura' merujuk pada negara?", "Jepang", ["Korea Selatan", "China", "Thailand"]],
    ],
    sulit: [
      ["Perjanjian yang mengakhiri Perang Dunia I adalah?", "Perjanjian Versailles", ["Perjanjian Postdam", "Perjanjian Paris", "Perjanjian Roma"]],
      ["Organisasi ekonomi negara-negara Asia Tenggara disebut?", "ASEAN", ["APEC", "OPEC", "G20"]],
      ["Konferensi yang melahirkan Gerakan Non-Blok diselenggarakan di kota?", "Bandung", ["Jakarta", "Bogor", "Yogyakarta"]],
    ],
  },
  GEO: {
    mudah: [
      ["Gunung tertinggi di Indonesia adalah?", "Puncak Jaya", ["Gunung Semeru", "Gunung Rinjani", "Gunung Kerinci"]],
      ["Benua terluas di dunia adalah?", "Asia", ["Afrika", "Eropa", "Amerika"]],
      ["Sungai terpanjang di dunia adalah?", "Sungai Nil", ["Sungai Amazon", "Sungai Mississippi", "Sungai Yangtze"]],
      ["Pulau terbesar di Indonesia adalah?", "Kalimantan", ["Sumatra", "Jawa", "Sulawesi"]],
      ["Samudra terluas di dunia adalah?", "Pasifik", ["Atlantik", "Hindia", "Arktik"]],
      ["Iklim di sebagian besar wilayah Indonesia adalah?", "Tropis", ["Subtropis", "Kutub", "Gurun"]],
      ["Garis 0° lintang disebut?", "Khatulistiwa", ["Meridian", "Tropik", "Ekuator Selatan"]],
    ],
    sedang: [
      ["Ibu kota Australia adalah?", "Canberra", ["Sydney", "Melbourne", "Perth"]],
      ["Selat pemisah Pulau Sumatra dan Jawa adalah?", "Selat Sunda", ["Selat Malaka", "Selat Bali", "Selat Karimata"]],
      ["Gurun terluas di dunia adalah?", "Sahara", ["Gobi", "Kalahari", "Gurun Arab"]],
      ["Danau terbesar di Indonesia adalah?", "Danau Toba", ["Danau Sentani", "Danau Poso", "Danau Singkarak"]],
      ["Fenomena naik-turunnya suhu global akibat gas rumah kaca disebut?", "Pemanasan global", ["El Nino", "La Nina", "Efek Coriolis"]],
    ],
    sulit: [
      ["Garis khayal pembagi bumi jadi utara-selatan disebut?", "Garis Bujur", ["Garis Lintang", "Garis Balik Utara", "Garis Tanggal Internasional"]],
      ["Naiknya air laut berkala akibat gravitasi bulan disebut?", "Pasang surut", ["Tsunami", "Arus laut", "Abrasi"]],
      ["Lapisan atmosfer tempat terjadinya sebagian besar fenomena cuaca adalah?", "Troposfer", ["Stratosfer", "Mesosfer", "Termosfer"]],
    ],
  },
  SOS: {
    mudah: [
      ["Pancasila terdiri dari berapa sila?", "5", ["4", "6", "7"]],
      ["Lembaga pembuat undang-undang di Indonesia adalah?", "DPR", ["MA", "KPK", "BPK"]],
      ["Ilmu yang mempelajari masyarakat disebut?", "Sosiologi", ["Biologi", "Geologi", "Ekonomi"]],
      ["Proses peniruan perilaku orang lain disebut?", "Imitasi", ["Isolasi", "Interaksi", "Adaptasi"]],
      ["Perpindahan penduduk dari desa ke kota disebut?", "Urbanisasi", ["Transmigrasi", "Emigrasi", "Imigrasi"]],
      ["Lembaga sosial pertama yang dikenal manusia adalah?", "Keluarga", ["Sekolah", "Negara", "Ekonomi"]],
    ],
    sedang: [
      ["Sistem ekonomi gabungan kapitalis & sosialis disebut?", "Ekonomi campuran", ["Ekonomi pasar", "Ekonomi terpusat", "Ekonomi tradisional"]],
      ["Interaksi sosial yang mengarah pada persatuan disebut?", "Asosiatif", ["Disosiatif", "Akomodatif", "Konfliktual"]],
      ["Norma yang bersumber dari agama disebut norma?", "Agama", ["Hukum", "Kesopanan", "Kebiasaan"]],
      ["Konflik sosial dapat disebabkan oleh?", "Perbedaan kepentingan", ["Kesamaan pendapat", "Kerja sama", "Gotong royong"]],
      ["Status yang diperoleh sejak lahir disebut status?", "Ascribed", ["Achieved", "Assigned", "Mixed"]],
    ],
    sulit: [
      ["Teori masyarakat berkembang lewat konflik kelas dari?", "Karl Marx", ["Max Weber", "Emile Durkheim", "Auguste Comte"]],
      ["Mobilitas dari petani menjadi pengusaha disebut?", "Mobilitas vertikal naik", ["Mobilitas horizontal", "Mobilitas vertikal turun", "Mobilitas antargenerasi"]],
      ["Lembaga yang berfungsi mengendalikan penyimpangan sosial disebut lembaga?", "Pengendalian sosial", ["Sosialisasi", "Stratifikasi", "Diferensiasi sosial"]],
    ],
  },
};

function generateFactQuestion(mapel, difficulty, usedTexts) {
  const bank = FACT_BANK[mapel] || {};
  let pool = (bank[difficulty] || []).filter((item) => !usedTexts.has(item[0]));
  if (pool.length === 0) {
    const allTiers = Object.values(bank).flat();
    pool = allTiers.filter((item) => !usedTexts.has(item[0]));
    if (pool.length === 0) pool = allTiers;
  }
  const [text, correct, distractors] = sgPick(pool);
  return [text, correct, factOptions(correct, distractors)];
}

/* ---------------- API utama ---------------- */
const NUMERIC_GEN = { MTK: generateMTK, FSK: generateFSK, KIM: generateKIM };

function generateOne(mapel, difficulty, used) {
  let q, tries = 0;
  do {
    q = NUMERIC_GEN[mapel] ? NUMERIC_GEN[mapel](difficulty) : generateFactQuestion(mapel, difficulty, used);
    tries++;
  } while (used.has(q[0]) && tries < 20);
  return q;
}

function generateMatchQuestions(mapel, rankLabel, count) {
  count = count || 20;
  const difficulty = getDifficultyFromRank(rankLabel);
  const used = new Set();
  const out = [];
  for (let i = 0; i < count; i++) {
    const q = generateOne(mapel, difficulty, used);
    used.add(q[0]);
    out.push(q);
  }
  return out;
}

const ALL_SUBJECTS = ["MTK", "FSK", "KIM", "BIO", "BID", "BEN", "PUM", "GEO", "SOS"];
function generateChaosQuestions(rankLabel, count) {
  count = count || 20;
  const difficulty = getDifficultyFromRank(rankLabel);
  const used = new Set();
  const out = [];
  for (let i = 0; i < count; i++) {
    const mapel = sgPick(ALL_SUBJECTS);
    const q = generateOne(mapel, difficulty, used);
    used.add(q[0]);
    out.push(q);
  }
  return out;
}

/* ---------------------------- AUDIO ---------------------------- */
const bgMusic = document.getElementById("bg-music");
bgMusic.volume = 0.35;
let audioEnabled = true;

function playBackgroundMusic() {
  if (!audioEnabled) return;
  bgMusic.play().catch(() => {
    console.log("Audio menunggu interaksi pengguna.");
  });
}

// Synthesized short SFX (tidak perlu file tambahan) lewat WebAudio.
let audioCtx = null;
function beep(freq, duration, type = "sine", vol = 0.18) {
  if (!audioEnabled) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    /* WebAudio tidak tersedia — abaikan */
  }
}
const sfx = {
  claim: () => beep(720, 0.15, "square", 0.15),
  correct: () => { beep(660, 0.12); setTimeout(() => beep(880, 0.18), 90); },
  wrong: () => beep(160, 0.25, "sawtooth", 0.15),
  tick: () => beep(500, 0.05, "square", 0.05),
  rankup: () => { beep(523, 0.15); setTimeout(() => beep(659, 0.15), 120); setTimeout(() => beep(784, 0.25), 260); },
};

/* ---------------------------- RANK SYSTEM ---------------------------- */
const RANK_TIERS = [
  { key: "novice", label: "NOVICE", img: "novice" },
  { key: "scholar", label: "SCHOLAR", img: "scholar" },
  { key: "expert", label: "EXPERT", img: "expert" },
  { key: "elite", label: "ELITE", img: "elite" },
  { key: "master", label: "MASTER", img: "master" },
  { key: "grand", label: "GRAND SCHOLAR", img: "grand_scholar" },
  { key: "legend", label: "ACADEMIC LEGEND", img: "academic_legend" },
];
const SUBLEVELS = ["III", "II", "I"];
const XP_PER_SUBLEVEL = 100;
const XP_PER_TIER = XP_PER_SUBLEVEL * SUBLEVELS.length;
const MAX_XP = XP_PER_TIER * RANK_TIERS.length;

function computeRank(xpRaw) {
  const xp = Math.max(0, Math.min(xpRaw, MAX_XP - 1));
  let tierIndex = Math.floor(xp / XP_PER_TIER);
  if (tierIndex >= RANK_TIERS.length) tierIndex = RANK_TIERS.length - 1;
  const remainder = xp - tierIndex * XP_PER_TIER;
  let subIdx = Math.min(SUBLEVELS.length - 1, Math.floor(remainder / XP_PER_SUBLEVEL));
  const xpIntoLevel = remainder - subIdx * XP_PER_SUBLEVEL;
  const tier = RANK_TIERS[tierIndex];
  return {
    tierIndex,
    tier,
    subIdx,
    label: `${tier.label} ${SUBLEVELS[subIdx]}`,
    xpIntoLevel,
    xpForLevel: XP_PER_SUBLEVEL,
    progressPct: Math.round((xpIntoLevel / XP_PER_SUBLEVEL) * 100),
    img: `rank/${tier.img}-removebg-preview.png`,
    cssClass: tier.key === "grand" ? "grand" : tier.key === "legend" ? "legend" : tier.key,
  };
}

/* ---------------------------- ACCOUNT SYSTEM ---------------------------- */
const DB_KEY = "bb_accounts_v1";
const SESSION_KEY = "bb_session_v1";

function loadDB() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveDB(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.log("Gagal menyimpan progres:", e);
  }
}
function defaultStats() {
  return { matches: 0, answers: 0, correct: 0, first: 0 };
}
function createAccount(username, password) {
  const db = loadDB();
  const key = username.toLowerCase();
  if (db[key]) return { ok: false, msg: "Nama pemain sudah dipakai, coba nama lain." };
  const account = {
    username,
    password,
    xp: 0,
    stats: defaultStats(),
    createdAt: Date.now(),
  };
  db[key] = account;
  saveDB(db);
  return { ok: true, account };
}
function loginAccount(username, password) {
  const db = loadDB();
  const key = username.toLowerCase();
  const account = db[key];
  if (!account) return { ok: false, msg: "Akun tidak ditemukan. Coba Sign In dulu." };
  if (account.password !== password) return { ok: false, msg: "Kata sandi salah." };
  return { ok: true, account };
}
function persistAccount() {
  if (!state.account) return;
  const db = loadDB();
  db[state.account.username.toLowerCase()] = state.account;
  saveDB(db);
}
function setSession(username) {
  localStorage.setItem(SESSION_KEY, username.toLowerCase());
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
function getSessionAccount() {
  const key = localStorage.getItem(SESSION_KEY);
  if (!key) return null;
  const db = loadDB();
  return db[key] || null;
}

function applyAccountToUI() {
  if (!state.account) return;
  const r = computeRank(state.account.xp);
  document.getElementById("topbar-name").textContent = state.account.username;
  document.getElementById("topbar-rank").textContent = r.label + " • Lv. 01";
  document.getElementById("lobby-rank-label").textContent = r.label;
  document.getElementById("lobby-rank-emblem").textContent = rankEmoji(r.tierIndex);
  document.getElementById("lobby-xp-bar").style.width = r.progressPct + "%";
  document.getElementById("lobby-xp-text").textContent = `${r.xpIntoLevel} / ${r.xpForLevel} XP`;
  document.getElementById("profile-name").textContent = state.account.username;
  document.getElementById("profile-rank").textContent = r.label;
  document.getElementById("profile-badge").textContent = rankEmoji(r.tierIndex);
}
function rankEmoji(tierIndex) {
  return ["🌱", "🕊️", "💡", "🎓", "🏅", "🌌", "👑"][tierIndex] || "🌱";
}

/* ---------------------------- JURUSAN (IPA / IPS) ---------------------------- */
const JURUSAN_LIST = [
  { code: "ipa", label: "IPA", desc: "Matematika • Fisika • Kimia • Biologi" },
  { code: "ips", label: "IPS", desc: "B. Indonesia • B. Inggris • P. Umum • Geografi • Sosiologi" },
];

/* ---------------------------- SUBJECTS & QUESTIONS ---------------------------- */
const subjects = [
  { code: "MTK", name: "Matematika", cat: "MTK", jurusan: "ipa" },
  { code: "FSK", name: "Fisika", cat: "FSK", jurusan: "ipa" },
  { code: "KIM", name: "Kimia", cat: "KIM", jurusan: "ipa" },
  { code: "BIO", name: "Biologi", cat: "BIO", jurusan: "ipa" },
  { code: "BID", name: "B. Indonesia", cat: "BID", jurusan: "ips" },
  { code: "BEN", name: "B. Inggris", cat: "BEN", jurusan: "ips" },
  { code: "PUM", name: "Pengetahuan Umum", cat: "PUM", jurusan: "ips" },
  { code: "GEO", name: "Geografi", cat: "GEO", jurusan: "ips" },
  { code: "SOS", name: "Sosiologi", cat: "SOS", jurusan: "ips" },
];
function subjectsByJurusan(code) {
  return subjects.filter((s) => s.jurusan === code);
}
/* Render dua tombol besar IPA / IPS. onPick(code) dipanggil saat salah satu dipilih. */
function renderJurusanGrid(gridId, current, onPick) {
  const el = document.getElementById(gridId);
  if (!el) return;
  el.innerHTML = JURUSAN_LIST.map(
    (j) =>
      `<button class="jurusan-btn ${j.code === current ? "selected" : ""}" data-jurusan="${j.code}"><b>${j.label}</b><small>${j.desc}</small></button>`,
  ).join("");
  el.querySelectorAll("[data-jurusan]").forEach((b) => (b.onclick = () => onPick(b.dataset.jurusan)));
}
/* Render daftar mapel HANYA dari jurusan yang sedang dipilih. onPick(code) dipanggil saat mapel dipilih. */
function renderSubjectGrid(gridId, jurusan, current, onPick) {
  const el = document.getElementById(gridId);
  if (!el) return;
  const list = subjectsByJurusan(jurusan);
  el.innerHTML = list
    .map(
      (s) =>
        `<button class="subject-btn ${s.code === current ? "selected" : ""}" data-subject-pick="${s.code}"><b>${s.code}</b><small>${s.name}</small></button>`,
    )
    .join("");
  el.querySelectorAll("[data-subject-pick]").forEach((b) => (b.onclick = () => onPick(b.dataset.subjectPick)));
}

const questions = {
  MTK: [
    ["Berapakah hasil dari 12 × 8?", "96", ["86", "96", "108", "88"]],
    ["Jika x + 7 = 19, nilai x adalah...", "12", ["10", "11", "12", "13"]],
    ["25% dari 240 adalah...", "60", ["40", "50", "60", "80"]],
    ["Hasil dari 9² adalah...", "81", ["72", "81", "90", "99"]],
    ["Keliling persegi dengan sisi 9 cm adalah...", "36 cm", ["18 cm", "27 cm", "36 cm", "81 cm"]],
    ["Hasil dari 7 + 6 × 3 adalah...", "25", ["25", "39", "21", "18"]],
    ["Akar kuadrat dari 144 adalah...", "12", ["10", "11", "12", "14"]],
    ["Jika 3x = 27, maka x = ...", "9", ["6", "7", "8", "9"]],
    ["Luas lingkaran dengan jari-jari 7 (π=22/7) adalah...", "154", ["144", "150", "154", "160"]],
    ["Hasil dari 100 : 4 × 2 adalah...", "50", ["25", "40", "50", "60"]],
  ],
  FSK: [
    ["Satuan SI untuk gaya adalah...", "Newton", ["Joule", "Newton", "Pascal", "Watt"]],
    ["Kecepatan 120 km ditempuh dalam 2 jam adalah...", "60 km/jam", ["40 km/jam", "50 km/jam", "60 km/jam", "80 km/jam"]],
    ["Satuan SI untuk usaha/energi adalah...", "Joule", ["Newton", "Joule", "Watt", "Volt"]],
    ["Alat untuk mengukur suhu adalah...", "Termometer", ["Barometer", "Termometer", "Amperemeter", "Speedometer"]],
    ["Bunyi tidak dapat merambat melalui...", "Ruang hampa", ["Udara", "Air", "Ruang hampa", "Besi"]],
    ["Hukum kekekalan energi menyatakan energi...", "Tidak dapat diciptakan atau dimusnahkan", ["Selalu bertambah", "Selalu berkurang", "Tidak dapat diciptakan atau dimusnahkan", "Berubah jadi materi"]],
    ["Percepatan gravitasi bumi kira-kira...", "9,8 m/s²", ["6,8 m/s²", "9,8 m/s²", "12,8 m/s²", "3,8 m/s²"]],
    ["Cermin yang bersifat menyebarkan cahaya adalah cermin...", "Cembung", ["Cekung", "Cembung", "Datar", "Ganda"]],
    ["Satuan tekanan dalam SI adalah...", "Pascal", ["Newton", "Pascal", "Joule", "Watt"]],
    ["Rangkaian listrik yang jika satu lampu putus semua padam adalah...", "Seri", ["Paralel", "Seri", "Campuran", "Terbuka"]],
  ],
  KIM: [
    ["Rumus kimia air adalah...", "H₂O", ["CO₂", "O₂", "H₂O", "NaCl"]],
    ["pH 7 pada suhu ruang bersifat...", "Netral", ["Asam", "Netral", "Basa", "Garam"]],
    ["Lambang unsur untuk emas adalah...", "Au", ["Ag", "Au", "Fe", "Pb"]],
    ["Gas yang dibutuhkan manusia untuk bernapas adalah...", "Oksigen", ["Nitrogen", "Oksigen", "Karbon dioksida", "Hidrogen"]],
    ["Garam dapur memiliki rumus kimia...", "NaCl", ["NaCl", "KCl", "CaCO₃", "MgSO₄"]],
    ["Proses perubahan zat padat langsung menjadi gas disebut...", "Sublimasi", ["Kondensasi", "Sublimasi", "Deposisi", "Evaporasi"]],
    ["Unsur dengan nomor atom 1 adalah...", "Hidrogen", ["Helium", "Hidrogen", "Litium", "Karbon"]],
    ["Larutan asam memiliki pH...", "Kurang dari 7", ["Lebih dari 7", "Sama dengan 7", "Kurang dari 7", "Sama dengan 14"]],
    ["Reaksi pembakaran selalu menghasilkan...", "Energi panas", ["Energi dingin", "Energi panas", "Energi listrik", "Energi kimia saja"]],
    ["CO₂ dikenal sebagai gas...", "Karbon dioksida", ["Karbon monoksida", "Karbon dioksida", "Oksigen", "Nitrogen dioksida"]],
  ],
  BIO: [
    ["Organ yang memompa darah adalah...", "Jantung", ["Paru-paru", "Ginjal", "Jantung", "Hati"]],
    ["Proses tumbuhan membuat makanan disebut...", "Fotosintesis", ["Respirasi", "Fotosintesis", "Osmosis", "Fermentasi"]],
    ["Satuan terkecil kehidupan adalah...", "Sel", ["Jaringan", "Sel", "Organ", "Organisme"]],
    ["Organel sel yang menghasilkan energi adalah...", "Mitokondria", ["Nukleus", "Ribosom", "Mitokondria", "Vakuola"]],
    ["Proses pertukaran gas pada manusia terjadi di...", "Paru-paru", ["Jantung", "Paru-paru", "Ginjal", "Usus"]],
    ["Tumbuhan menyerap air melalui...", "Akar", ["Daun", "Batang", "Akar", "Bunga"]],
    ["DNA terletak di dalam...", "Inti sel", ["Sitoplasma", "Inti sel", "Membran sel", "Dinding sel"]],
    ["Hewan yang berkembang biak dengan bertelur disebut...", "Ovipar", ["Vivipar", "Ovipar", "Ovovivipar", "Membelah diri"]],
    ["Proses pernapasan pada ikan menggunakan...", "Insang", ["Paru-paru", "Insang", "Kulit", "Trakea"]],
    ["Rantai makanan diawali oleh...", "Produsen", ["Konsumen I", "Konsumen II", "Produsen", "Pengurai"]],
  ],
  BID: [
    ["Lawan kata 'optimis' adalah...", "Pesimis", ["Aktif", "Pesimis", "Kreatif", "Realistis"]],
    ["Kata baku yang benar adalah...", "Risiko", ["Resiko", "Risikko", "Risiko", "Riziko"]],
    ["Kalimat yang menggunakan majas personifikasi adalah...", "Daun menari ditiup angin", ["Dia secepat kilat", "Daun menari ditiup angin", "Suaranya merdu", "Hatinya sekeras batu"]],
    ["Sinonim dari kata 'cerdas' adalah...", "Pintar", ["Pintar", "Malas", "Lamban", "Lupa"]],
    ["Kata 'mereka' termasuk jenis kata...", "Kata ganti", ["Kata benda", "Kata kerja", "Kata ganti", "Kata sifat"]],
    ["Teks yang berisi langkah-langkah disebut teks...", "Prosedur", ["Narasi", "Deskripsi", "Prosedur", "Eksposisi"]],
    ["Kalimat tanya biasanya diakhiri dengan tanda...", "Tanya (?)", ["Titik (.)", "Tanya (?)", "Seru (!)", "Koma (,)"]],
    ["Antonim dari kata 'rajin' adalah...", "Malas", ["Giat", "Tekun", "Malas", "Cekatan"]],
    ["Ide pokok paragraf biasanya terdapat pada kalimat...", "Utama", ["Penjelas", "Utama", "Penutup", "Tanya"]],
    ["Kata baku untuk 'apotik' adalah...", "Apotek", ["Apotik", "Apotek", "Apotheek", "Aphotek"]],
  ],
  BEN: [
    ["What is the opposite of 'difficult'?", "Easy", ["Hard", "Easy", "Slow", "Heavy"]],
    ["Choose the correct sentence.", "She is studying", ["She studying", "She are study", "She is studying", "She studying is"]],
    ["The synonym of 'happy' is...", "Glad", ["Sad", "Glad", "Angry", "Tired"]],
    ["Past tense of 'go' is...", "Went", ["Goed", "Went", "Gone", "Going"]],
    ["'Book' in Bahasa Indonesia means...", "Buku", ["Meja", "Buku", "Kursi", "Pensil"]],
    ["Choose the correct plural form of 'child'.", "Children", ["Childs", "Children", "Childes", "Childrens"]],
    ["'I ___ a student.' Fill in the blank.", "am", ["is", "am", "are", "be"]],
    ["The opposite of 'fast' is...", "Slow", ["Quick", "Slow", "Rapid", "Speedy"]],
    ["Which one is a question word?", "Where", ["Where", "Book", "Table", "Run"]],
    ["'They ___ playing football.' Fill in the blank.", "are", ["is", "am", "are", "be"]],
  ],
  PUM: [
    ["Ibukota negara Jepang adalah...", "Tokyo", ["Kyoto", "Tokyo", "Osaka", "Nagoya"]],
    ["Planet terbesar di tata surya adalah...", "Jupiter", ["Saturn", "Earth", "Jupiter", "Mars"]],
    ["Proklamasi kemerdekaan Indonesia dibacakan pada tanggal...", "17 Agustus 1945", ["17 Agustus 1945", "1 Juni 1945", "28 Oktober 1928", "10 November 1945"]],
    ["Mata uang negara Jepang adalah...", "Yen", ["Won", "Yen", "Yuan", "Dolar"]],
    ["Organisasi kesehatan dunia disingkat...", "WHO", ["WHO", "UNICEF", "UNESCO", "FIFA"]],
    ["Presiden pertama Indonesia adalah...", "Soekarno", ["Soeharto", "Soekarno", "Habibie", "Sudirman"]],
    ["Benua dengan penduduk terbanyak adalah...", "Asia", ["Afrika", "Eropa", "Asia", "Amerika"]],
    ["Menara Eiffel berada di kota...", "Paris", ["London", "Paris", "Roma", "Berlin"]],
    ["Hewan berkaki delapan disebut...", "Arakhnida", ["Insekta", "Arakhnida", "Reptil", "Moluska"]],
    ["Lambang negara Indonesia adalah...", "Garuda Pancasila", ["Garuda Pancasila", "Elang Jawa", "Komodo", "Harimau Sumatra"]],
  ],
  GEO: [
    ["Garis 0° lintang disebut...", "Khatulistiwa", ["Meridian", "Khatulistiwa", "Tropik", "Ekuator Selatan"]],
    ["Benua terluas di dunia adalah...", "Asia", ["Afrika", "Eropa", "Asia", "Amerika"]],
    ["Gunung tertinggi di dunia adalah...", "Everest", ["Everest", "K2", "Kilimanjaro", "Fuji"]],
    ["Samudra terluas di dunia adalah...", "Pasifik", ["Atlantik", "Hindia", "Pasifik", "Arktik"]],
    ["Ibu kota negara Indonesia (sebelum IKN) adalah...", "Jakarta", ["Bandung", "Jakarta", "Surabaya", "Medan"]],
    ["Sungai terpanjang di dunia adalah...", "Nil", ["Amazon", "Nil", "Mississippi", "Yangtze"]],
    ["Pulau terbesar di Indonesia adalah...", "Kalimantan", ["Sumatra", "Jawa", "Kalimantan", "Sulawesi"]],
    ["Iklim di sebagian besar Indonesia adalah...", "Tropis", ["Tropis", "Subtropis", "Kutub", "Gurun"]],
    ["Gurun terluas di dunia adalah...", "Sahara", ["Gobi", "Sahara", "Kalahari", "Arab"]],
    ["Selat yang memisahkan Sumatra dan Jawa adalah...", "Selat Sunda", ["Selat Malaka", "Selat Sunda", "Selat Bali", "Selat Karimata"]],
  ],
  SOS: [
    ["Ilmu yang mempelajari masyarakat disebut...", "Sosiologi", ["Biologi", "Sosiologi", "Geologi", "Ekonomi"]],
    ["Interaksi sosial terjadi ketika ada...", "Hubungan antarindividu", ["Satu benda", "Hubungan antarindividu", "Cuaca", "Hewan saja"]],
    ["Kumpulan individu yang punya kesadaran bersama disebut...", "Kelompok sosial", ["Kelompok sosial", "Individu", "Benda mati", "Populasi hewan"]],
    ["Proses peniruan perilaku orang lain disebut...", "Imitasi", ["Imitasi", "Isolasi", "Interaksi", "Adaptasi"]],
    ["Perpindahan penduduk dari desa ke kota disebut...", "Urbanisasi", ["Urbanisasi", "Transmigrasi", "Emigrasi", "Imigrasi"]],
    ["Norma yang bersumber dari agama disebut norma...", "Agama", ["Hukum", "Kesopanan", "Agama", "Kebiasaan"]],
    ["Konflik sosial dapat disebabkan oleh...", "Perbedaan kepentingan", ["Kesamaan pendapat", "Perbedaan kepentingan", "Kerja sama", "Gotong royong"]],
    ["Proses sosial yang mengarah pada persatuan disebut...", "Asosiatif", ["Asosiatif", "Disosiatif", "Netral", "Individual"]],
    ["Status yang diperoleh sejak lahir disebut status...", "Ascribed", ["Achieved", "Ascribed", "Assigned", "Mixed"]],
    ["Lembaga sosial pertama yang dikenal manusia adalah...", "Keluarga", ["Sekolah", "Keluarga", "Negara", "Ekonomi"]],
  ],
};

/* ---------------------------- PLAYER / BOT / FRIEND POOLS ---------------------------- */
const BOT_NAME_POOL = ["Tasya", "Faris", "Aisyah", "Daffa", "Nadia", "Raka", "Sinta", "Bima", "Luna", "Dimas"];
const FRIEND_POOL = [
  { name: "Kevin", avatar: "🧑🏻" },
  { name: "Salsa", avatar: "👩🏻‍🦱" },
  { name: "Yusuf", avatar: "🧑🏽" },
  { name: "Nabila", avatar: "👩🏽‍🦳" },
  { name: "Arka", avatar: "🧑🏻‍🦲" },
  { name: "Citra", avatar: "👩🏻‍🦰" },
  { name: "Farhan", avatar: "🧑🏾" },
  { name: "Wulan", avatar: "👩🏼" },
];
const teams = [
  ["Team Nova", "Player 01", "Tasya"],
  ["Team Orbit", "Faris", "Aisyah"],
  ["Team Pixel", "Daffa", "Nadia"],
  ["Team Zenith", "Raka", "Sinta"],
  ["Team Quantum", "Bima", "Luna"],
];

/* ---------------------------- STATE ---------------------------- */
const state = {
  screen: "intro",
  mode: null,
  jurusan: "ips",
  subject: "PUM",
  qIndex: 0,
  timerId: null,
  time: 15,
  claimed: false,
  claimant: null,
  players: [],
  scores: {},
  history: [],
  xp: 0,
  correct: 0,
  teamScores: [0, 0, 0, 0, 0],
  classProgress: [0, 0, 0, 0, 0],
  classRound: 0,
  memoryOrder: [],
  memoryTimerId: null,
  rankLobbyChoice: null,
  selectedFriends: [],
  account: null,
};

/* ---------------------------- HELPERS ---------------------------- */
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("screen-" + id).classList.add("active");
  state.screen = id;
  if (id === "lobby") playBackgroundMusic();
}
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._to);
  toast._to = setTimeout(() => t.classList.remove("show"), 1800);
}
function shuffle(a) {
  return [...a].sort(() => Math.random() - 0.5);
}

/* ---- unified phase timer (fixes the "countdown stops working" bug) ----
   Every phase (waiting for claim, waiting for an answer, memory reveal...)
   goes through this single helper so a stale interval from a previous phase
   can never keep running (and silently expiring) underneath a new phase. */
function clearGameTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}
function startPhaseTimer(seconds, onTick, onExpire) {
  clearGameTimer();
  state.time = seconds;
  onTick(state.time);
  state.timerId = setInterval(() => {
    state.time--;
    onTick(state.time);
    if (state.time <= 0) {
      clearGameTimer();
      onExpire();
    }
  }, 1000);
}

/* ---------------------------- SUBJECT / MODE MENUS ---------------------------- */
function subjectButtons() {
  renderJurusanGrid("jurusan-grid", state.jurusan, (code) => {
    state.jurusan = code;
    const list = subjectsByJurusan(code);
    if (!list.some((s) => s.code === state.subject)) state.subject = list[0].code;
    subjectButtons();
    toast("Jurusan dipilih: " + code.toUpperCase());
  });
  renderSubjectGrid("subject-grid", state.jurusan, state.subject, (code) => {
    state.subject = code;
    subjectButtons();
    toast("Mapel dipilih: " + state.subject);
  });
}
function chaosCloud() {
  document.getElementById("chaos-cloud").innerHTML = subjects
    .map((s) => `<span>${s.code} · ${s.name}</span>`)
    .join("");
}
function teamPreview() {
  document.getElementById("team-preview").innerHTML = teams
    .map((t) => `<div class="team-col"><b>${t[0]}</b><p>👤 ${t[1]}</p><p>👤 ${t[2]}</p><small>0 poin</small></div>`)
    .join("");
}
function classPreview() {
  const names = ["Tasya", "Faris", "Aisyah", "Daffa", "Player 01"];
  document.getElementById("class-preview").innerHTML = names
    .map((n, i) => `<div class="progress-row"><span>${n}</span><b>${i === 4 ? 0 : Math.floor(Math.random() * 8)} poin</b></div>`)
    .join("");
}

/* ---------------------------- RANK LOBBY (solo / undang teman) ---------------------------- */
function openRankLobby() {
  state.rankLobbyChoice = null;
  state.selectedFriends = [];
  document.getElementById("rank-lobby-subject").textContent = `Mapel: ${state.subject} • Tentukan cara bermainmu.`;
  document.getElementById("invite-panel").classList.add("hidden");
  document.getElementById("rank-start-btn").classList.add("hidden");
  document.querySelectorAll("[data-rank-lobby]").forEach((b) => b.classList.remove("selected-panel"));
  renderFriendInviteGrid();
  show("rank-lobby");
}
function renderFriendInviteGrid() {
  document.getElementById("invite-grid").innerHTML = FRIEND_POOL.map(
    (f) => `<button class="invite-card" data-friend="${f.name}"><span class="iavatar">${f.avatar}</span><b>${f.name}</b></button>`,
  ).join("");
  document.querySelectorAll("[data-friend]").forEach(
    (card) =>
      (card.onclick = () => {
        const name = card.dataset.friend;
        const idx = state.selectedFriends.indexOf(name);
        if (idx >= 0) {
          state.selectedFriends.splice(idx, 1);
          card.classList.remove("selected");
        } else {
          if (state.selectedFriends.length >= 4) {
            toast("Maksimal 4 teman yang bisa diundang!");
            return;
          }
          state.selectedFriends.push(name);
          card.classList.add("selected");
        }
        updateInviteInfo();
      }),
  );
  updateInviteInfo();
}
function updateInviteInfo() {
  document.getElementById("invite-info").textContent =
    `${state.selectedFriends.length} / 4 teman dipilih • sisa slot diisi bot`;
  document.querySelectorAll("[data-friend]").forEach((card) => {
    const selected = state.selectedFriends.includes(card.dataset.friend);
    card.classList.toggle("disabled", !selected && state.selectedFriends.length >= 4);
  });
}
function startRankMatch() {
  if (!state.rankLobbyChoice) {
    toast("Pilih MAIN SOLO atau UNDANG TEMAN dulu.");
    return;
  }
  const players = [{ name: "Player 01", isFriend: false, isBot: false }];
  if (state.rankLobbyChoice === "squad") {
    state.selectedFriends.forEach((f) => players.push({ name: f, isFriend: true, isBot: false }));
  }
  const need = 5 - players.length;
  const usedNames = new Set(players.map((p) => p.name));
  const botPool = shuffle(BOT_NAME_POOL.filter((n) => !usedNames.has(n))).slice(0, need);
  botPool.forEach((n) => players.push({ name: n, isFriend: false, isBot: true }));
  startMatch("rank", players);
}

/* ---------------------------- MATCH (classic / rank / chaos) ---------------------------- */
function defaultPlayers() {
  const chosenBots = shuffle(BOT_NAME_POOL).slice(0, 4);
  return [{ name: "Player 01", isFriend: false, isBot: false }, ...chosenBots.map((n) => ({ name: n, isFriend: false, isBot: true }))];
}
function currentRankLabel() {
  return state.account ? computeRank(state.account.xp).label : "NOVICE III";
}
function startMatch(mode, players) {
  state.mode = mode;
  state.qIndex = 0;
  state.history = [];
  state.correct = 0;
  state.players = players || defaultPlayers();
  state.scores = {};
  state.players.forEach((p) => (state.scores[p.name] = 0));
  document.getElementById("game-mode-label").textContent =
    mode === "classic" ? "CLASSIC" : mode === "rank" ? "RANK" : "CHAOS";
  document.getElementById("game-subject-label").textContent = mode === "chaos" ? "CAMPURAN" : state.subject;
  // Soal digenerate baru tiap match (beda tiap game) & kesulitan mengikuti rank pemain.
  state.questionPool =
    mode === "chaos"
      ? generateChaosQuestions(currentRankLabel(), 20)
      : generateMatchQuestions(state.subject, currentRankLabel(), 20);
  show("game");
  renderPlayers();
  loadQuestion();
}
function openMode(mode) {
  startMatch(mode);
}
function getQuestion() {
  const pool = state.questionPool || (state.mode === "chaos" ? Object.values(questions).flat() : questions[state.subject]);
  const q = pool[state.qIndex % pool.length];
  if (!q) return ["Pertanyaan bonus: 2 + 2 = ?", "4", ["3", "4", "5", "6"]];
  return q;
}
function renderPlayers() {
  document.getElementById("players").innerHTML = state.players
    .map((p) => {
      const isMe = p.name === "Player 01";
      const tag = isMe ? "KAMU" : p.isFriend ? "TEMAN • MENUNGGU" : "BOT • MENUNGGU";
      return `<div class="player-row ${isMe ? "me" : ""}"><span class="score">${state.scores[p.name]}</span><b>${p.name}</b><small>${tag}</small></div>`;
    })
    .join("");
}
function loadQuestion() {
  state.claimed = false;
  state.claimant = null;
  const q = getQuestion();
  document.getElementById("question-count").textContent = `SOAL ${state.qIndex + 1} / 20`;
  document.getElementById("question-category").textContent = state.mode === "chaos" ? "CAMPURAN" : state.subject;
  document.getElementById("question-text").textContent = q[0];
  document.getElementById("question-answers").innerHTML = "";
  document.getElementById("claim-status").textContent = "SIAPA YANG PALING CEPAT?";
  document.querySelector("#claim-box p").textContent = "Tekan REBUT SOAL untuk mendapatkan kesempatan menjawab.";
  document.querySelector(".claim-btn").disabled = false;

  startPhaseTimer(
    15,
    (t) => (document.getElementById("timer-value").textContent = t),
    () => timeOut(),
  );

  // Bot/teman bisa merebut lebih dulu jika pemain menunggu terlalu lama.
  setTimeout(() => {
    if (!state.claimed && Math.random() < 0.3) botClaim();
  }, 2600);
}
function botClaim() {
  if (state.claimed) return;
  const candidates = state.players.filter((p) => p.name !== "Player 01");
  if (!candidates.length) return;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  state.claimed = true;
  state.claimant = pick.name;
  sfx.claim();
  document.getElementById("claim-status").textContent = pick.name + " MEREBUT SOAL";
  document.querySelector("#claim-box p").textContent = "Tunggu 3 detik sebelum jawaban dibuka.";
  document.querySelector(".claim-btn").disabled = true;
  clearGameTimer();
  document.getElementById("timer-value").textContent = "-";
  setTimeout(() => botAnswer(pick.name), 3000);
}
function claim() {
  if (state.claimed) return;
  state.claimed = true;
  state.claimant = "Player 01";
  sfx.claim();
  document.querySelector(".claim-btn").disabled = true;
  document.getElementById("claim-status").textContent = "PLAYER 01 MEREBUT SOAL";
  document.querySelector("#claim-box p").textContent = "Jawaban akan dibuka dalam 3 detik...";
  clearGameTimer();
  document.getElementById("timer-value").textContent = "-";
  setTimeout(() => showAnswers(), 3000);
}
function showAnswers() {
  const q = getQuestion();
  document.querySelector("#claim-box p").textContent = "Jawab sekarang! 15 detik berjalan.";
  document.getElementById("question-answers").innerHTML = shuffle(q[2])
    .map((a) => `<button class="answer-btn" data-answer="${a.replaceAll('"', "&quot;")}">${a}</button>`)
    .join("");
  document.querySelectorAll(".answer-btn").forEach((b) => (b.onclick = () => answer(b.dataset.answer)));
  // Timer jawaban baru — ini yang sebelumnya tidak pernah di-restart (bug utama).
  startPhaseTimer(
    15,
    (t) => (document.getElementById("timer-value").textContent = t),
    () => answerTimeout(),
  );
}
function logHistory(q, chosenAnswer, isCorrect, claimant) {
  state.history.push({
    qIndex: state.qIndex,
    text: q[0],
    correctAnswer: q[1],
    claimant,
    chosenAnswer,
    isCorrect,
  });
}
function answer(ans) {
  if (state.claimant !== "Player 01") return;
  clearGameTimer();
  const q = getQuestion();
  const ok = ans === q[1];
  if (ok) {
    state.correct++;
    state.scores["Player 01"] += 100;
    sfx.correct();
    toast("Benar! +100 poin");
  } else {
    sfx.wrong();
    toast("Jawaban salah. Soal dilempar!");
  }
  document.querySelectorAll(".answer-btn").forEach((b) => {
    if (b.dataset.answer === q[1]) b.classList.add("correct");
    if (b.dataset.answer === ans && !ok) b.classList.add("wrong");
  });
  logHistory(q, ans, ok, "Player 01");
  renderPlayers();
  setTimeout(() => nextQuestion(), 1000);
}
function answerTimeout() {
  const q = getQuestion();
  toast("Waktu jawab habis!");
  if (state.claimant === "Player 01") {
    logHistory(q, null, false, "Player 01");
  }
  setTimeout(() => nextQuestion(), 600);
}
function botAnswer(name) {
  const q = getQuestion();
  const ok = Math.random() < 0.72;
  if (ok) state.scores[name] += 100;
  document.getElementById("question-answers").innerHTML =
    `<div style="color:${ok ? "#64f5bd" : "#ff718b"};font-weight:800">${name}: ${ok ? "JAWABAN BENAR" : "SALAH — DILEMPAR KE PEMAIN BERIKUTNYA"}</div>`;
  logHistory(q, null, null, name);
  renderPlayers();
  setTimeout(() => nextQuestion(), 900);
}
function timeOut() {
  toast("Waktu habis — soal dilempar!");
  const q = getQuestion();
  if (!state.claimed) {
    logHistory(q, null, false, null);
    state.claimed = true;
    state.claimant = "SYSTEM";
  }
  setTimeout(() => {
    if (state.claimant !== "Player 01") botClaim();
  }, 500);
}
function nextQuestion() {
  clearGameTimer();
  state.qIndex++;
  if (state.qIndex >= 20) {
    finishGame();
    return;
  }
  loadQuestion();
}
function finishGame() {
  clearGameTimer();
  let ranking = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
  const pos = ranking.findIndex((x) => x[0] === "Player 01") + 1;
  let earned = pos === 1 ? 10 : pos === 2 ? 7 : pos === 3 ? 5 : 0;
  if (state.mode === "classic") earned = 0;

  let oldRank = null,
    newRank = null;
  if (state.account) {
    oldRank = computeRank(state.account.xp);
    state.account.xp = Math.min(MAX_XP - 1, state.account.xp + earned);
    state.account.stats.matches++;
    state.account.stats.correct += state.correct;
    state.account.stats.answers += state.history.filter((h) => h.claimant === "Player 01").length;
    if (pos === 1) state.account.stats.first++;
    newRank = computeRank(state.account.xp);
    persistAccount();
    applyAccountToUI();
  }

  document.getElementById("result-xp").textContent = `+${earned} XP`;
  document.getElementById("result-message").textContent =
    state.mode === "classic"
      ? "Mode Classic tidak menambah XP Rank."
      : earned
        ? `Kamu finis #${pos}. XP Rank bertambah!`
        : `Kamu finis #${pos}. Belum mendapat XP Rank.`;
  document.getElementById("result-board").innerHTML = ranking
    .map(
      (r, i) =>
        `<div class="result-row"><b>#${i + 1}</b><span>${r[0]}</span><span>${r[1]} pts</span><small>${i === 0 ? "+10 XP" : i === 1 ? "+7 XP" : i === 2 ? "+5 XP" : "+0 XP"}</small></div>`,
    )
    .join("");

  if (newRank) {
    document.getElementById("result-rank").textContent = newRank.label;
    document.getElementById("result-xp-bar").style.width = newRank.progressPct + "%";
  }

  document.getElementById("review-btn").classList.toggle("hidden", state.mode !== "classic");
  show("results");

  if (oldRank && newRank && oldRank.label !== newRank.label) {
    setTimeout(() => showRankUp(newRank), 500);
  }
}
function showRankUp(rank) {
  sfx.rankup();
  document.getElementById("rankup-img").src = rank.img;
  document.getElementById("rankup-label").textContent = rank.label;
  document.getElementById("rankup-overlay").classList.remove("hidden");
}
function showReview() {
  document.getElementById("review-list").innerHTML = state.history
    .map((h) => {
      const status = h.isCorrect === true ? "correct" : h.isCorrect === false ? "wrong" : "unanswered";
      let answerLine;
      if (h.claimant === "Player 01" && h.chosenAnswer) {
        answerLine = `<span class="${h.isCorrect ? "ok" : "bad"}">Jawabanmu: ${h.chosenAnswer}</span>`;
      } else if (h.claimant === "Player 01") {
        answerLine = `<span class="bad">Kamu tidak sempat menjawab</span>`;
      } else if (h.claimant) {
        answerLine = `<span>Direbut oleh: ${h.claimant}</span>`;
      } else {
        answerLine = `<span class="bad">Tidak ada yang merebut soal ini</span>`;
      }
      return `<div class="review-item ${status}">
        <b class="review-q">${h.qIndex + 1}. ${h.text}</b>
        <div class="review-meta">
          <span>Jawaban benar: <b>${h.correctAnswer}</b></span>
          ${answerLine}
        </div>
      </div>`;
    })
    .join("") || "<p class='muted'>Belum ada data pembahasan.</p>";
  show("review");
}

/* ---------------------------- CHAOS ---------------------------- */
function startChaos() {
  startMatch("chaos");
}

/* ---------------------------- TEAM BATTLE ---------------------------- */
function startTeam() {
  state.teamScores = [0, 0, 0, 0, 0];
  state.mode = "team";
  state.qIndex = 0;
  state.teamQuestionPool = generateChaosQuestions(currentRankLabel(), 20);
  show("game");
  document.getElementById("game-mode-label").textContent = "TEAM";
  document.getElementById("game-subject-label").textContent = "CAMPURAN";
  renderTeamPlayers();
  loadTeamQuestion();
}
function renderTeamPlayers() {
  document.getElementById("players").innerHTML = teams
    .map(
      (t, i) =>
        `<div class="player-row ${i === 0 ? "me" : ""}"><span class="score">${state.teamScores[i]}</span><b>${t[0]}</b><small>${t[1]} + ${t[2]}</small></div>`,
    )
    .join("");
}
function loadTeamQuestion() {
  state.claimed = false;
  state.claimant = null;
  const pool = state.teamQuestionPool || Object.values(questions).flat(),
    q = pool[state.qIndex % pool.length];
  document.getElementById("question-count").textContent = `SOAL ${state.qIndex + 1} / 20`;
  document.getElementById("question-category").textContent = "TEAM • CAMPURAN";
  document.getElementById("question-text").textContent = q[0];
  document.getElementById("question-answers").innerHTML = "";
  document.getElementById("claim-status").textContent = "REBUT SOAL UNTUK TIM";
  document.querySelector("#claim-box p").textContent = "Pemain dari tim mana pun dapat merebut soal.";
  document.querySelector(".claim-btn").disabled = false;

  startPhaseTimer(
    15,
    (t) => (document.getElementById("timer-value").textContent = t),
    () => {
      toast("Waktu habis!");
      nextTeamQuestion();
    },
  );

  setTimeout(() => {
    if (!state.claimed && Math.random() < 0.3) {
      state.claimed = true;
      const team = 1 + Math.floor(Math.random() * 4);
      clearGameTimer();
      document.getElementById("timer-value").textContent = "-";
      document.getElementById("claim-status").textContent = teams[team][0] + " MEREBUT";
      setTimeout(() => {
        const ok = Math.random() < 0.7;
        if (ok) state.teamScores[team] += 100;
        toast(ok ? "Tim bot benar" : "Tim bot salah");
        renderTeamPlayers();
        nextTeamQuestion();
      }, 3000);
    }
  }, 2500);
}
function claimTeam() {
  if (state.claimed) return;
  state.claimed = true;
  clearGameTimer();
  sfx.claim();
  document.querySelector(".claim-btn").disabled = true;
  document.getElementById("timer-value").textContent = "-";
  document.getElementById("claim-status").textContent = "TEAM NOVA MEREBUT SOAL";
  document.querySelector("#claim-box p").textContent = "Diskusikan dengan timmu — 3 detik sebelum jawaban.";
  setTimeout(() => {
    const pool = state.teamQuestionPool || Object.values(questions).flat();
    const q = pool[state.qIndex % pool.length];
    document.getElementById("question-answers").innerHTML = shuffle(q[2])
      .map((a) => `<button class="answer-btn" data-answer="${a}">${a}</button>`)
      .join("");
    startPhaseTimer(
      15,
      (t) => (document.getElementById("timer-value").textContent = t),
      () => nextTeamQuestion(),
    );
    document.querySelectorAll(".answer-btn").forEach(
      (b) =>
        (b.onclick = () => {
          clearGameTimer();
          if (b.dataset.answer === q[1]) {
            state.teamScores[0] += 100;
            sfx.correct();
            toast("Team Nova benar!");
          } else {
            sfx.wrong();
            toast("Salah — giliran berikutnya");
          }
          renderTeamPlayers();
          setTimeout(nextTeamQuestion, 800);
        }),
    );
  }, 3000);
}
function nextTeamQuestion() {
  clearGameTimer();
  state.qIndex++;
  if (state.qIndex >= 20) {
    finishTeam();
    return;
  }
  loadTeamQuestion();
}
function finishTeam() {
  clearGameTimer();
  const order = state.teamScores.map((s, i) => [teams[i][0], s]).sort((a, b) => b[1] - a[1]);
  document.getElementById("result-board").innerHTML = order
    .map(
      (r, i) =>
        `<div class="result-row"><b>#${i + 1}</b><span>${r[0]}</span><span>${r[1]} pts</span><small>${i === 0 ? "+10 XP" : i === 1 ? "+7 XP" : i === 2 ? "+5 XP" : "+0 XP"}</small></div>`,
    )
    .join("");
  const earned = order[0][0] === "Team Nova" ? 10 : 0;
  let oldRank = null,
    newRank = null;
  if (state.account) {
    oldRank = computeRank(state.account.xp);
    state.account.xp = Math.min(MAX_XP - 1, state.account.xp + earned);
    state.account.stats.matches++;
    newRank = computeRank(state.account.xp);
    persistAccount();
    applyAccountToUI();
    document.getElementById("result-rank").textContent = newRank.label;
    document.getElementById("result-xp-bar").style.width = newRank.progressPct + "%";
  }
  document.getElementById("result-xp").textContent = `+${earned} XP`;
  document.getElementById("result-message").textContent = "Hasil Team Battle — XP mengikuti posisi timmu.";
  document.getElementById("review-btn").classList.add("hidden");
  show("results");
  if (oldRank && newRank && oldRank.label !== newRank.label) {
    setTimeout(() => showRankUp(newRank), 500);
  }
}

/* ---------------------------- CLASS MODE ---------------------------- */
function startClass() {
  show("class-game");
  state.classProgress = [0, 0, 0, 0, 0];
  state.classRound = 0;
  renderClassProgress();
  startMemory();
}
function renderClassProgress() {
  const names = ["Tasya", "Faris", "Aisyah", "Daffa", "Player 01"];
  document.getElementById("class-progress").innerHTML = names
    .map((n, i) => `<div class="progress-row"><span>${n}</span><b>${state.classProgress[i]} pts</b></div>`)
    .join("");
}
function startMemory() {
  state.classRound = 0;
  document.getElementById("memory-panel").classList.remove("hidden");
  document.getElementById("logic-panel").classList.add("hidden");
  document.getElementById("class-round-label").textContent = "MEMORY CARDS";
  const symbols = shuffle(["★", "◆", "●", "▲", "★", "◆", "●", "▲", "☀", "☁", "♥", "♣", "☀", "☁", "♥", "♣"]);
  document.getElementById("memory-grid").innerHTML = symbols
    .map((s, i) => `<button class="memory-card revealed" data-symbol="${s}" data-index="${i}">${s}</button>`)
    .join("");
  state.memoryOrder = symbols;
  clearInterval(state.memoryTimerId);
  let t = 15;
  document.getElementById("class-timer").textContent = t;
  state.memoryTimerId = setInterval(() => {
    t--;
    document.getElementById("class-timer").textContent = t;
    if (t <= 0) {
      clearInterval(state.memoryTimerId);
      hideMemory();
    }
  }, 1000);
}
function hideMemory() {
  document.querySelectorAll(".memory-card").forEach((b) => (b.textContent = "?"));
  document.getElementById("memory-instruction").textContent =
    "Klik pasangan kartu yang sama. Kamu mendapat poin untuk setiap pasangan.";
  let first = null,
    lock = false,
    matched = 0;
  document.querySelectorAll(".memory-card").forEach(
    (card) =>
      (card.onclick = () => {
        if (lock || card.classList.contains("matched") || card === first) return;
        card.textContent = card.dataset.symbol;
        if (!first) {
          first = card;
          return;
        }
        if (first.dataset.symbol === card.dataset.symbol) {
          first.classList.add("matched");
          card.classList.add("matched");
          matched++;
          state.classProgress[4] += 25;
          renderClassProgress();
          first = null;
          if (matched >= 4) setTimeout(startLogic, 700);
        } else {
          lock = true;
          setTimeout(() => {
            first.textContent = "?";
            card.textContent = "?";
            first = null;
            lock = false;
          }, 500);
        }
      }),
  );
  state.classProgress[0] = 50;
  state.classProgress[1] = 75;
  state.classProgress[2] = 100;
  state.classProgress[3] = 25;
  renderClassProgress();
}
function startLogic() {
  document.getElementById("memory-panel").classList.add("hidden");
  document.getElementById("logic-panel").classList.remove("hidden");
  document.getElementById("class-round-label").textContent = "LETTER LOGIC";
  document.getElementById("class-timer").textContent = "∞";
  document.getElementById("logic-equation").innerHTML =
    "<b>AB<br>+ AC<br>———<br>BCA</b><br><small>A, B, C adalah angka berbeda. Tentukan ABC.</small>";
  document.getElementById("logic-answer").value = "";
}
function submitLogic() {
  const val = document.getElementById("logic-answer").value.trim().toUpperCase();
  if (val === "246" || val === "123") {
    state.classProgress[4] += 100;
    sfx.correct();
    toast("Logika berhasil!");
  } else {
    sfx.wrong();
    toast("Coba lagi — format jawaban ABC.");
  }
  renderClassProgress();
  setTimeout(() => finishClass(), 900);
}
function finishClass() {
  document.getElementById("result-board").innerHTML = state.classProgress
    .map(
      (p, i) =>
        `<div class="result-row"><b>#${i + 1}</b><span>${["Tasya", "Faris", "Aisyah", "Daffa", "Player 01"][i]}</span><span>${p} pts</span><small>${i === 4 ? "+0 XP" : "BOT"}</small></div>`,
    )
    .join("");
  document.getElementById("result-xp").textContent = "+0 XP";
  document.getElementById("result-message").textContent = "Class Mode tidak menggunakan XP Rank.";
  document.getElementById("review-btn").classList.add("hidden");
  show("results");
}

/* ---------------------------- PROFILE ---------------------------- */
function profile() {
  const stats = (state.account && state.account.stats) || defaultStats();
  document.getElementById("profile-stats").innerHTML = [
    ["MATCH", stats.matches],
    ["JAWABAN", stats.answers],
    ["BENAR", stats.correct],
    ["JUARA 1", stats.first],
  ]
    .map((s) => `<div class="stat"><b>${s[1]}</b><small>${s[0]}</small></div>`)
    .join("");
  applyAccountToUI();
  show("profile");
}

/* ---------------------------- AUTH (Sign In / Login) ---------------------------- */
function wireAuthForms() {
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".auth-form").forEach((f) => f.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("form-" + tab.dataset.authTab).classList.add("active");
      document.getElementById("auth-note").textContent = "";
    };
  });

  document.getElementById("form-signin").addEventListener("submit", (e) => {
    e.preventDefault();
    const u = document.getElementById("signin-username").value.trim();
    const p = document.getElementById("signin-password").value;
    const p2 = document.getElementById("signin-password2").value;
    const note = document.getElementById("auth-note");
    if (u.length < 3) return (note.textContent = "Nama pemain minimal 3 karakter.");
    if (p.length < 4) return (note.textContent = "Kata sandi minimal 4 karakter.");
    if (p !== p2) return (note.textContent = "Konfirmasi kata sandi tidak cocok.");
    const res = createAccount(u, p);
    if (!res.ok) return (note.textContent = res.msg);
    note.textContent = "";
    state.account = res.account;
    setSession(u);
    applyAccountToUI();
    playBackgroundMusic();
    toast("Akun berhasil dibuat! Selamat datang, " + u);
    show("rank-open"); // reveal NOVICE — hanya muncul sekali untuk akun baru
  });

  document.getElementById("form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    const u = document.getElementById("login-username").value.trim();
    const p = document.getElementById("login-password").value;
    const note = document.getElementById("auth-note");
    const res = loginAccount(u, p);
    if (!res.ok) return (note.textContent = res.msg);
    note.textContent = "";
    state.account = res.account;
    setSession(u);
    applyAccountToUI();
    playBackgroundMusic();
    toast("Selamat datang kembali, " + u + "!");
    show("lobby"); // login biasa: langsung ke lobby, tanpa reveal novice
  });
}

/* ---------------------------- EVENTS ---------------------------- */
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-action]");
  if (!a) return;
  const act = a.dataset.action;

  if (act === "open-rank") {
    const existing = getSessionAccount();
    if (existing) {
      state.account = existing;
      applyAccountToUI();
      playBackgroundMusic();
      show("lobby");
    } else {
      show("auth");
    }
  }
  if (act === "back-intro") show("intro");
  if (act === "rank-list") show("ranks");
  if (act === "back-rank") show("rank-open");
  if (act === "lobby") show("lobby");
  if (act === "play-menu") {
    show("play-menu");
    subjectButtons();
  }
  if (act === "team") {
    show("team");
    teamPreview();
  }
  if (act === "class") {
    show("class");
    classPreview();
  }
  if (act === "settings") show("settings");
  if (act === "profile") profile();
  if (act === "claim") {
    if (typeof MP !== "undefined" && MP.active) claimOnline();
    else state.mode === "team" ? claimTeam() : claim();
  }
  if (act === "start-chaos") startChaos();
  if (act === "start-team") startTeam();
  if (act === "start-class") startClass();
  if (act === "start-rank") startRankMatch();
  if (act === "submit-logic") submitLogic();
  if (act === "review") showReview();
  if (act === "results-back") show("results");
  if (act === "rankup-close") document.getElementById("rankup-overlay").classList.add("hidden");
  if (act === "logout") {
    clearSession();
    state.account = null;
    show("intro");
    toast("Berhasil keluar akun.");
  }
  if (act === "quit-game") {
    if (typeof MP !== "undefined" && MP.active) leaveOnlineMatch();
    clearGameTimer();
    clearInterval(state.memoryTimerId);
    show("lobby");
  }
});

document.querySelectorAll("[data-mode]").forEach(
  (b) =>
    (b.onclick = () => {
      if (b.dataset.mode === "rank") openRankLobby();
      else openMode(b.dataset.mode);
    }),
);
document.querySelectorAll("[data-rank-lobby]").forEach(
  (b) =>
    (b.onclick = () => {
      state.rankLobbyChoice = b.dataset.rankLobby;
      document.querySelectorAll("[data-rank-lobby]").forEach((x) => x.classList.remove("selected-panel"));
      b.classList.add("selected-panel");
      document.getElementById("rank-start-btn").classList.remove("hidden");
      document.getElementById("invite-panel").classList.toggle("hidden", state.rankLobbyChoice !== "squad");
    }),
);

// Pengaturan: audio & animasi toggle.
document.getElementById("audio-toggle").addEventListener("change", (e) => {
  audioEnabled = e.target.checked;
  bgMusic.muted = !audioEnabled;
  if (audioEnabled) playBackgroundMusic();
});
document.getElementById("animation-toggle").addEventListener("change", (e) => {
  document.body.classList.toggle("no-anim", !e.target.checked);
});

/* ---------------------------- INIT ---------------------------- */
wireAuthForms();
subjectButtons();
chaosCloud();
teamPreview();
classPreview();

// Jika sesi masih tersimpan (pemain sebelumnya belum logout), siapkan datanya
// di background supaya begitu mereka menekan LETS PLAY TOGETHER langsung ke lobby.
(function initSession() {
  const existing = getSessionAccount();
  if (existing) {
    state.account = existing;
    applyAccountToUI();
  }
})();
