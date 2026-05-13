export type WhatsappCountry = {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
};

export const WHATSAPP_COUNTRIES: WhatsappCountry[] = [
  { code: "rs", name: "Serbia", flag: "🇷🇸", dialCode: "+381" },
  { code: "af", name: "Afganistán", flag: "🇦🇫", dialCode: "+93" },
  { code: "ax", name: "Alandia", flag: "🇦🇽", dialCode: "+35818" },
  { code: "al", name: "Albania", flag: "🇦🇱", dialCode: "+355" },
  { code: "de", name: "Alemania", flag: "🇩🇪", dialCode: "+49" },
  { code: "ad", name: "Andorra", flag: "🇦🇩", dialCode: "+376" },
  { code: "ao", name: "Angola", flag: "🇦🇴", dialCode: "+244" },
  { code: "ai", name: "Anguilla", flag: "🇦🇮", dialCode: "+1264" },
  { code: "ag", name: "Antigua y Barbuda", flag: "🇦🇬", dialCode: "+1268" },
  { code: "sa", name: "Arabia Saudí", flag: "🇸🇦", dialCode: "+966" },
  { code: "dz", name: "Argelia", flag: "🇩🇿", dialCode: "+213" },
  { code: "ar", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
  { code: "am", name: "Armenia", flag: "🇦🇲", dialCode: "+374" },
  { code: "aw", name: "Aruba", flag: "🇦🇼", dialCode: "+297" },
  { code: "au", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "at", name: "Austria", flag: "🇦🇹", dialCode: "+43" },
  { code: "az", name: "Azerbaiyán", flag: "🇦🇿", dialCode: "+994" },
  { code: "bs", name: "Bahamas", flag: "🇧🇸", dialCode: "+1242" },
  { code: "bh", name: "Bahrein", flag: "🇧🇭", dialCode: "+973" },
  { code: "bd", name: "Bangladesh", flag: "🇧🇩", dialCode: "+880" },
  { code: "bb", name: "Barbados", flag: "🇧🇧", dialCode: "+1246" },
  { code: "bz", name: "Belice", flag: "🇧🇿", dialCode: "+501" },
  { code: "bj", name: "Benín", flag: "🇧🇯", dialCode: "+229" },
  { code: "bm", name: "Bermudas", flag: "🇧🇲", dialCode: "+1441" },
  { code: "by", name: "Bielorrusia", flag: "🇧🇾", dialCode: "+375" },
  { code: "bo", name: "Bolivia", flag: "🇧🇴", dialCode: "+591" },
  { code: "ba", name: "Bosnia y Herzegovina", flag: "🇧🇦", dialCode: "+387" },
  { code: "bw", name: "Botswana", flag: "🇧🇼", dialCode: "+267" },
  { code: "br", name: "Brasil", flag: "🇧🇷", dialCode: "+55" },
  { code: "bn", name: "Brunei", flag: "🇧🇳", dialCode: "+673" },
  { code: "bg", name: "Bulgaria", flag: "🇧🇬", dialCode: "+359" },
  { code: "bf", name: "Burkina Faso", flag: "🇧🇫", dialCode: "+226" },
  { code: "bi", name: "Burundi", flag: "🇧🇮", dialCode: "+257" },
  { code: "bt", name: "Bután", flag: "🇧🇹", dialCode: "+975" },
  { code: "be", name: "Bélgica", flag: "🇧🇪", dialCode: "+32" },
  { code: "cv", name: "Cabo Verde", flag: "🇨🇻", dialCode: "+238" },
  { code: "kh", name: "Camboya", flag: "🇰🇭", dialCode: "+855" },
  { code: "cm", name: "Camerún", flag: "🇨🇲", dialCode: "+237" },
  { code: "ca", name: "Canadá", flag: "🇨🇦", dialCode: "+1" },
  { code: "bq", name: "Caribe Neerlandés", flag: "🇧🇶", dialCode: "+599" },
  { code: "qa", name: "Catar", flag: "🇶🇦", dialCode: "+974" },
  { code: "td", name: "Chad", flag: "🇹🇩", dialCode: "+235" },
  { code: "cz", name: "Chequia", flag: "🇨🇿", dialCode: "+420" },
  { code: "cl", name: "Chile", flag: "🇨🇱", dialCode: "+56" },
  { code: "cn", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { code: "cy", name: "Chipre", flag: "🇨🇾", dialCode: "+357" },
  { code: "va", name: "Ciudad del Vaticano", flag: "🇻🇦", dialCode: "+3906698" },
  { code: "co", name: "Colombia", flag: "🇨🇴", dialCode: "+57" },
  { code: "km", name: "Comoras", flag: "🇰🇲", dialCode: "+269" },
  { code: "cg", name: "Congo", flag: "🇨🇬", dialCode: "+242" },
  { code: "cd", name: "Congo (Rep. Dem.)", flag: "🇨🇩", dialCode: "+243" },
  { code: "kp", name: "Corea del Norte", flag: "🇰🇵", dialCode: "+850" },
  { code: "kr", name: "Corea del Sur", flag: "🇰🇷", dialCode: "+82" },
  { code: "ci", name: "Costa de Marfil", flag: "🇨🇮", dialCode: "+225" },
  { code: "cr", name: "Costa Rica", flag: "🇨🇷", dialCode: "+506" },
  { code: "hr", name: "Croacia", flag: "🇭🇷", dialCode: "+385" },
  { code: "cu", name: "Cuba", flag: "🇨🇺", dialCode: "+53" },
  { code: "cw", name: "Curazao", flag: "🇨🇼", dialCode: "+599" },
  { code: "dk", name: "Dinamarca", flag: "🇩🇰", dialCode: "+45" },
  { code: "dj", name: "Djibouti", flag: "🇩🇯", dialCode: "+253" },
  { code: "dm", name: "Dominica", flag: "🇩🇲", dialCode: "+1767" },
  { code: "ec", name: "Ecuador", flag: "🇪🇨", dialCode: "+593" },
  { code: "eg", name: "Egipto", flag: "🇪🇬", dialCode: "+20" },
  { code: "sv", name: "El Salvador", flag: "🇸🇻", dialCode: "+503" },
  { code: "ae", name: "Emiratos Árabes Unidos", flag: "🇦🇪", dialCode: "+971" },
  { code: "er", name: "Eritrea", flag: "🇪🇷", dialCode: "+291" },
  { code: "si", name: "Eslovenia", flag: "🇸🇮", dialCode: "+386" },
  { code: "es", name: "España", flag: "🇪🇸", dialCode: "+34" },
  { code: "us", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1" },
  { code: "ee", name: "Estonia", flag: "🇪🇪", dialCode: "+372" },
  { code: "et", name: "Etiopía", flag: "🇪🇹", dialCode: "+251" },
  { code: "ph", name: "Filipinas", flag: "🇵🇭", dialCode: "+63" },
  { code: "fi", name: "Finlandia", flag: "🇫🇮", dialCode: "+358" },
  { code: "fj", name: "Fiyi", flag: "🇫🇯", dialCode: "+679" },
  { code: "fr", name: "Francia", flag: "🇫🇷", dialCode: "+33" },
  { code: "ga", name: "Gabón", flag: "🇬🇦", dialCode: "+241" },
  { code: "gm", name: "Gambia", flag: "🇬🇲", dialCode: "+220" },
  { code: "ge", name: "Georgia", flag: "🇬🇪", dialCode: "+995" },
  { code: "gh", name: "Ghana", flag: "🇬🇭", dialCode: "+233" },
  { code: "gi", name: "Gibraltar", flag: "🇬🇮", dialCode: "+350" },
  { code: "gr", name: "Grecia", flag: "🇬🇷", dialCode: "+30" },
  { code: "gd", name: "Grenada", flag: "🇬🇩", dialCode: "+1473" },
  { code: "gl", name: "Groenlandia", flag: "🇬🇱", dialCode: "+299" },
  { code: "gp", name: "Guadalupe", flag: "🇬🇵", dialCode: "+590" },
  { code: "gu", name: "Guam", flag: "🇬🇺", dialCode: "+1671" },
  { code: "gt", name: "Guatemala", flag: "🇬🇹", dialCode: "+502" },
  { code: "gf", name: "Guayana Francesa", flag: "🇬🇫", dialCode: "+594" },
  { code: "gg", name: "Guernsey", flag: "🇬🇬", dialCode: "+44" },
  { code: "gn", name: "Guinea", flag: "🇬🇳", dialCode: "+224" },
  { code: "gq", name: "Guinea Ecuatorial", flag: "🇬🇶", dialCode: "+240" },
  { code: "gw", name: "Guinea-Bisáu", flag: "🇬🇼", dialCode: "+245" },
  { code: "gy", name: "Guyana", flag: "🇬🇾", dialCode: "+592" },
  { code: "ht", name: "Haití", flag: "🇭🇹", dialCode: "+509" },
  { code: "hn", name: "Honduras", flag: "🇭🇳", dialCode: "+504" },
  { code: "hk", name: "Hong Kong", flag: "🇭🇰", dialCode: "+852" },
  { code: "hu", name: "Hungría", flag: "🇭🇺", dialCode: "+36" },
  { code: "in", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "id", name: "Indonesia", flag: "🇮🇩", dialCode: "+62" },
  { code: "iq", name: "Irak", flag: "🇮🇶", dialCode: "+964" },
  { code: "ir", name: "Iran", flag: "🇮🇷", dialCode: "+98" },
  { code: "ie", name: "Irlanda", flag: "🇮🇪", dialCode: "+353" },
  { code: "bv", name: "Isla Bouvet", flag: "🇧🇻", dialCode: "+47" },
  { code: "im", name: "Isla de Man", flag: "🇮🇲", dialCode: "+44" },
  { code: "cx", name: "Isla de Navidad", flag: "🇨🇽", dialCode: "+61" },
  { code: "nf", name: "Isla de Norfolk", flag: "🇳🇫", dialCode: "+672" },
  { code: "is", name: "Islandia", flag: "🇮🇸", dialCode: "+354" },
  { code: "ky", name: "Islas Caimán", flag: "🇰🇾", dialCode: "+1345" },
  { code: "cc", name: "Islas Cocos o Islas Keeling", flag: "🇨🇨", dialCode: "+61" },
  { code: "ck", name: "Islas Cook", flag: "🇨🇰", dialCode: "+682" },
  { code: "fo", name: "Islas Faroe", flag: "🇫🇴", dialCode: "+298" },
  { code: "gs", name: "Islas Georgias del Sur y Sandwich del Sur", flag: "🇬🇸", dialCode: "+500" },
  { code: "fk", name: "Islas Malvinas", flag: "🇫🇰", dialCode: "+500" },
  { code: "mp", name: "Islas Marianas del Norte", flag: "🇲🇵", dialCode: "+1670" },
  { code: "mh", name: "Islas Marshall", flag: "🇲🇭", dialCode: "+692" },
  { code: "pn", name: "Islas Pitcairn", flag: "🇵🇳", dialCode: "+64" },
  { code: "sb", name: "Islas Salomón", flag: "🇸🇧", dialCode: "+677" },
  { code: "sj", name: "Islas Svalbard y Jan Mayen", flag: "🇸🇯", dialCode: "+4779" },
  { code: "tk", name: "Islas Tokelau", flag: "🇹🇰", dialCode: "+690" },
  { code: "tc", name: "Islas Turks y Caicos", flag: "🇹🇨", dialCode: "+1649" },
  { code: "um", name: "Islas Ultramarinas Menores de Estados Unidos", flag: "🇺🇲", dialCode: "+268" },
  { code: "vi", name: "Islas Vírgenes de los Estados Unidos", flag: "🇻🇮", dialCode: "+1340" },
  { code: "vg", name: "Islas Vírgenes del Reino Unido", flag: "🇻🇬", dialCode: "+1284" },
  { code: "il", name: "Israel", flag: "🇮🇱", dialCode: "+972" },
  { code: "it", name: "Italia", flag: "🇮🇹", dialCode: "+39" },
  { code: "jm", name: "Jamaica", flag: "🇯🇲", dialCode: "+1876" },
  { code: "jp", name: "Japón", flag: "🇯🇵", dialCode: "+81" },
  { code: "je", name: "Jersey", flag: "🇯🇪", dialCode: "+44" },
  { code: "jo", name: "Jordania", flag: "🇯🇴", dialCode: "+962" },
  { code: "kz", name: "Kazajistán", flag: "🇰🇿", dialCode: "+76" },
  { code: "ke", name: "Kenia", flag: "🇰🇪", dialCode: "+254" },
  { code: "kg", name: "Kirguizistán", flag: "🇰🇬", dialCode: "+996" },
  { code: "ki", name: "Kiribati", flag: "🇰🇮", dialCode: "+686" },
  { code: "xk", name: "Kosovo", flag: "🇽🇰", dialCode: "+383" },
  { code: "kw", name: "Kuwait", flag: "🇰🇼", dialCode: "+965" },
  { code: "la", name: "Laos", flag: "🇱🇦", dialCode: "+856" },
  { code: "ls", name: "Lesotho", flag: "🇱🇸", dialCode: "+266" },
  { code: "lv", name: "Letonia", flag: "🇱🇻", dialCode: "+371" },
  { code: "lr", name: "Liberia", flag: "🇱🇷", dialCode: "+231" },
  { code: "ly", name: "Libia", flag: "🇱🇾", dialCode: "+218" },
  { code: "li", name: "Liechtenstein", flag: "🇱🇮", dialCode: "+423" },
  { code: "lt", name: "Lituania", flag: "🇱🇹", dialCode: "+370" },
  { code: "lu", name: "Luxemburgo", flag: "🇱🇺", dialCode: "+352" },
  { code: "lb", name: "Líbano", flag: "🇱🇧", dialCode: "+961" },
  { code: "mo", name: "Macao", flag: "🇲🇴", dialCode: "+853" },
  { code: "mk", name: "Macedonia del Norte", flag: "🇲🇰", dialCode: "+389" },
  { code: "mg", name: "Madagascar", flag: "🇲🇬", dialCode: "+261" },
  { code: "my", name: "Malasia", flag: "🇲🇾", dialCode: "+60" },
  { code: "mw", name: "Malawi", flag: "🇲🇼", dialCode: "+265" },
  { code: "mv", name: "Maldivas", flag: "🇲🇻", dialCode: "+960" },
  { code: "ml", name: "Mali", flag: "🇲🇱", dialCode: "+223" },
  { code: "mt", name: "Malta", flag: "🇲🇹", dialCode: "+356" },
  { code: "ma", name: "Marruecos", flag: "🇲🇦", dialCode: "+212" },
  { code: "mq", name: "Martinica", flag: "🇲🇶", dialCode: "+596" },
  { code: "mu", name: "Mauricio", flag: "🇲🇺", dialCode: "+230" },
  { code: "mr", name: "Mauritania", flag: "🇲🇷", dialCode: "+222" },
  { code: "yt", name: "Mayotte", flag: "🇾🇹", dialCode: "+262" },
  { code: "fm", name: "Micronesia", flag: "🇫🇲", dialCode: "+691" },
  { code: "md", name: "Moldavia", flag: "🇲🇩", dialCode: "+373" },
  { code: "mn", name: "Mongolia", flag: "🇲🇳", dialCode: "+976" },
  { code: "me", name: "Montenegro", flag: "🇲🇪", dialCode: "+382" },
  { code: "ms", name: "Montserrat", flag: "🇲🇸", dialCode: "+1664" },
  { code: "mz", name: "Mozambique", flag: "🇲🇿", dialCode: "+258" },
  { code: "mm", name: "Myanmar", flag: "🇲🇲", dialCode: "+95" },
  { code: "mx", name: "México", flag: "🇲🇽", dialCode: "+52" },
  { code: "mc", name: "Mónaco", flag: "🇲🇨", dialCode: "+377" },
  { code: "na", name: "Namibia", flag: "🇳🇦", dialCode: "+264" },
  { code: "nr", name: "Nauru", flag: "🇳🇷", dialCode: "+674" },
  { code: "np", name: "Nepal", flag: "🇳🇵", dialCode: "+977" },
  { code: "ni", name: "Nicaragua", flag: "🇳🇮", dialCode: "+505" },
  { code: "ng", name: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
  { code: "nu", name: "Niue", flag: "🇳🇺", dialCode: "+683" },
  { code: "no", name: "Noruega", flag: "🇳🇴", dialCode: "+47" },
  { code: "nc", name: "Nueva Caledonia", flag: "🇳🇨", dialCode: "+687" },
  { code: "nz", name: "Nueva Zelanda", flag: "🇳🇿", dialCode: "+64" },
  { code: "ne", name: "Níger", flag: "🇳🇪", dialCode: "+227" },
  { code: "om", name: "Omán", flag: "🇴🇲", dialCode: "+968" },
  { code: "pk", name: "Pakistán", flag: "🇵🇰", dialCode: "+92" },
  { code: "pw", name: "Palau", flag: "🇵🇼", dialCode: "+680" },
  { code: "ps", name: "Palestina", flag: "🇵🇸", dialCode: "+970" },
  { code: "pa", name: "Panamá", flag: "🇵🇦", dialCode: "+507" },
  { code: "pg", name: "Papúa Nueva Guinea", flag: "🇵🇬", dialCode: "+675" },
  { code: "py", name: "Paraguay", flag: "🇵🇾", dialCode: "+595" },
  { code: "nl", name: "Países Bajos", flag: "🇳🇱", dialCode: "+31" },
  { code: "pe", name: "Perú", flag: "🇵🇪", dialCode: "+51" },
  { code: "pf", name: "Polinesia Francesa", flag: "🇵🇫", dialCode: "+689" },
  { code: "pl", name: "Polonia", flag: "🇵🇱", dialCode: "+48" },
  { code: "pt", name: "Portugal", flag: "🇵🇹", dialCode: "+351" },
  { code: "pr", name: "Puerto Rico", flag: "🇵🇷", dialCode: "+1787" },
  { code: "gb", name: "Reino Unido", flag: "🇬🇧", dialCode: "+44" },
  { code: "cf", name: "República Centroafricana", flag: "🇨🇫", dialCode: "+236" },
  { code: "do", name: "República Dominicana", flag: "🇩🇴", dialCode: "+1809" },
  { code: "sk", name: "República Eslovaca", flag: "🇸🇰", dialCode: "+421" },
  { code: "re", name: "Reunión", flag: "🇷🇪", dialCode: "+262" },
  { code: "rw", name: "Ruanda", flag: "🇷🇼", dialCode: "+250" },
  { code: "ro", name: "Rumania", flag: "🇷🇴", dialCode: "+40" },
  { code: "ru", name: "Rusia", flag: "🇷🇺", dialCode: "+73" },
  { code: "eh", name: "Sahara Occidental", flag: "🇪🇭", dialCode: "+2125288" },
  { code: "mf", name: "Saint Martin", flag: "🇲🇫", dialCode: "+590" },
  { code: "ws", name: "Samoa", flag: "🇼🇸", dialCode: "+685" },
  { code: "as", name: "Samoa Americana", flag: "🇦🇸", dialCode: "+1684" },
  { code: "bl", name: "San Bartolomé", flag: "🇧🇱", dialCode: "+590" },
  { code: "kn", name: "San Cristóbal y Nieves", flag: "🇰🇳", dialCode: "+1869" },
  { code: "sm", name: "San Marino", flag: "🇸🇲", dialCode: "+378" },
  { code: "pm", name: "San Pedro y Miquelón", flag: "🇵🇲", dialCode: "+508" },
  { code: "vc", name: "San Vicente y Granadinas", flag: "🇻🇨", dialCode: "+1784" },
  { code: "sh", name: "Santa Elena, Ascensión y Tristán de Acuña", flag: "🇸🇭", dialCode: "+290" },
  { code: "lc", name: "Santa Lucía", flag: "🇱🇨", dialCode: "+1758" },
  { code: "st", name: "Santo Tomé y Príncipe", flag: "🇸🇹", dialCode: "+239" },
  { code: "sn", name: "Senegal", flag: "🇸🇳", dialCode: "+221" },
  { code: "sc", name: "Seychelles", flag: "🇸🇨", dialCode: "+248" },
  { code: "sl", name: "Sierra Leone", flag: "🇸🇱", dialCode: "+232" },
  { code: "sg", name: "Singapur", flag: "🇸🇬", dialCode: "+65" },
  { code: "sx", name: "Sint Maarten", flag: "🇸🇽", dialCode: "+1721" },
  { code: "sy", name: "Siria", flag: "🇸🇾", dialCode: "+963" },
  { code: "so", name: "Somalia", flag: "🇸🇴", dialCode: "+252" },
  { code: "lk", name: "Sri Lanka", flag: "🇱🇰", dialCode: "+94" },
  { code: "sz", name: "Suazilandia", flag: "🇸🇿", dialCode: "+268" },
  { code: "za", name: "Sudáfrica", flag: "🇿🇦", dialCode: "+27" },
  { code: "sd", name: "Sudán", flag: "🇸🇩", dialCode: "+249" },
  { code: "ss", name: "Sudán del Sur", flag: "🇸🇸", dialCode: "+211" },
  { code: "se", name: "Suecia", flag: "🇸🇪", dialCode: "+46" },
  { code: "ch", name: "Suiza", flag: "🇨🇭", dialCode: "+41" },
  { code: "sr", name: "Surinam", flag: "🇸🇷", dialCode: "+597" },
  { code: "th", name: "Tailandia", flag: "🇹🇭", dialCode: "+66" },
  { code: "tw", name: "Taiwán", flag: "🇹🇼", dialCode: "+886" },
  { code: "tz", name: "Tanzania", flag: "🇹🇿", dialCode: "+255" },
  { code: "tj", name: "Tayikistán", flag: "🇹🇯", dialCode: "+992" },
  { code: "io", name: "Territorio Británico del Océano Índico", flag: "🇮🇴", dialCode: "+246" },
  { code: "tf", name: "Tierras Australes y Antárticas Francesas", flag: "🇹🇫", dialCode: "+262" },
  { code: "tl", name: "Timor Oriental", flag: "🇹🇱", dialCode: "+670" },
  { code: "tg", name: "Togo", flag: "🇹🇬", dialCode: "+228" },
  { code: "to", name: "Tonga", flag: "🇹🇴", dialCode: "+676" },
  { code: "tt", name: "Trinidad y Tobago", flag: "🇹🇹", dialCode: "+1868" },
  { code: "tm", name: "Turkmenistán", flag: "🇹🇲", dialCode: "+993" },
  { code: "tr", name: "Turquía", flag: "🇹🇷", dialCode: "+90" },
  { code: "tv", name: "Tuvalu", flag: "🇹🇻", dialCode: "+688" },
  { code: "tn", name: "Túnez", flag: "🇹🇳", dialCode: "+216" },
  { code: "ua", name: "Ucrania", flag: "🇺🇦", dialCode: "+380" },
  { code: "ug", name: "Uganda", flag: "🇺🇬", dialCode: "+256" },
  { code: "uy", name: "Uruguay", flag: "🇺🇾", dialCode: "+598" },
  { code: "uz", name: "Uzbekistán", flag: "🇺🇿", dialCode: "+998" },
  { code: "vu", name: "Vanuatu", flag: "🇻🇺", dialCode: "+678" },
  { code: "ve", name: "Venezuela", flag: "🇻🇪", dialCode: "+58" },
  { code: "vn", name: "Vietnam", flag: "🇻🇳", dialCode: "+84" },
  { code: "wf", name: "Wallis y Futuna", flag: "🇼🇫", dialCode: "+681" },
  { code: "ye", name: "Yemen", flag: "🇾🇪", dialCode: "+967" },
  { code: "zm", name: "Zambia", flag: "🇿🇲", dialCode: "+260" },
  { code: "zw", name: "Zimbabue", flag: "🇿🇼", dialCode: "+263" },
];

export type WhatsappCountryCode = (typeof WHATSAPP_COUNTRIES)[number]["code"];

export function getWhatsappCountry(code?: string | null): WhatsappCountry | undefined {
  if (!code) {
    return undefined;
  }

  return WHATSAPP_COUNTRIES.find((country) => country.code === code);
}

export function inferWhatsappCountryFromNumber(phone?: string | null): WhatsappCountry | undefined {
  if (!phone) {
    return undefined;
  }

  const normalized = phone.replace(/[^\d+]/g, "");
  const sorted = [...WHATSAPP_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  return sorted.find((country) => normalized.startsWith(country.dialCode));
}

export function splitWhatsappNumber(phone?: string | null): {
  countryCode: WhatsappCountryCode;
  localNumber: string;
} {
  const fallback = getWhatsappCountry("rs") ?? WHATSAPP_COUNTRIES[0];
  const normalized = (phone || "").replace(/[^\d+]/g, "");
  const country = inferWhatsappCountryFromNumber(phone) ?? fallback;

  let localNumber = normalized.startsWith(country.dialCode)
    ? normalized.slice(country.dialCode.length)
    : normalized.replace(/^\+/, "");

  localNumber = localNumber.replace(/^0+/, "");

  return {
    countryCode: country.code as WhatsappCountryCode,
    localNumber,
  };
}

export function composeWhatsappNumber(input: {
  countryCode?: string | null;
  localNumber?: string | null;
  legacyPhone?: string | null;
}): string {
  const country = getWhatsappCountry(input.countryCode) ?? inferWhatsappCountryFromNumber(input.legacyPhone) ?? getWhatsappCountry("rs") ?? WHATSAPP_COUNTRIES[0];
  const digits = (input.localNumber || "").replace(/\D+/g, "");

  if (!digits && input.legacyPhone) {
    const legacy = input.legacyPhone.replace(/[^\d+]/g, "");
    return legacy || "";
  }

  if (!digits) {
    return "";
  }

  return `${country.dialCode}${digits.replace(/^0+/, "")}`;
}

