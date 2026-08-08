## Basic App Information

Intelligent web-based Report Builder system. MERN-style web application using Node.js, Express, MongoDB/Mongoose, and React. JavaScript-only project.

The user is an Area Supervisor in a restaurant company with more than 14 branches in Addis Ababa, Ethiopia. On a normal workday, the supervisor may visit one or more branches. At the end of each day, the supervisor prepares a report for the boss.

Enable an Area Supervisor to record Amharic audio describing daily supervision activities and generate a boss-ready, professional, structured Amharic daily supervision report with less manual writing.

Eliminate the dependency on manually writing daily supervision reports using conventional document editing tools. Enable an Area Supervisor to speak their day in Amharic and receive a boss-ready, professionally structured daily supervision report with minimal manual effort.

- Text-to-speech — deferred to later version.
- Realtime audio processing — deferred to later version.
- Mobile native apps (iOS/Android) — web-only.
- Role-based access control — single user type (Area Supervisor).
- Automated translation — reports remain in original language.

---

Core Problem:

Area Supervisors in restaurant companies with multiple branches are responsible for visiting one or more branches each day to monitor operations, evaluate compliance with company standards, identify operational issues, provide guidance to branch teams, and ensure that corrective actions are implemented. At the end of every working day, they are required to prepare a comprehensive supervision report that accurately documents all activities performed, observations made, issues identified, recommendations provided, and follow-up actions required.

Preparing these daily reports is a time-consuming and inefficient process. Since an Area Supervisor spends most of the working day traveling between branches and conducting supervision activities, there is little or no opportunity to prepare reports while on-site. As a result, reports are typically prepared manually after returning home using document editing tools such as Microsoft Word. The supervisor must recall the entire day's activities from memory, organize scattered information, manually format the report according to the required reporting structure, and ensure that all important details are included. This repetitive manual process is labor-intensive, mentally demanding, and prone to omissions, inconsistencies, formatting errors, and inaccuracies.

The challenge becomes greater because supervision activities are naturally unstructured. Throughout the day, the supervisor may inspect multiple branches, communicate with managers and employees, identify operational and maintenance issues, verify inventory and cleanliness, observe customer service quality, follow up on previous actions, and provide recommendations for operational improvements. These activities are often remembered as a continuous narration or conversation rather than as a structured report. Manually transforming this unorganized information into a professional report requires considerable effort and significantly increases the possibility of overlooking important observations and follow-up actions.

In addition to report preparation, there is no centralized system for managing supervision activities. Information related to branches, daily supervision reports, transcriptions, generated reports, AI conversations, and historical records is often maintained separately or manually, making it difficult to efficiently organize, search, update, retrieve, and review previous reports. Managing supervision records for multiple branches over an extended period becomes increasingly difficult, reducing operational efficiency and limiting the ability to monitor historical performance, identify recurring issues, and support informed decision-making.

The existing reporting process depends heavily on manual writing, including using Telegram and WhatsApp, rather than intelligent automation. Although supervisors can verbally describe everything they accomplished during the day, there is no integrated system capable of converting an unstructured audio recording into a structured, professional supervision report. Consequently, valuable time is spent rewriting information that has already been communicated verbally instead of allowing technology to automate the transformation process.

Existing speech-to-text and artificial intelligence solutions generally provide limited support for Ethiopian languages, particularly Amharic, making it difficult to accurately transcribe spoken supervision activities and generate professional reports. This limitation prevents supervisors from fully utilizing AI-assisted reporting workflows while maintaining the linguistic accuracy required for business reporting.

As a result, the current reporting process reduces productivity, consumes valuable personal time outside working hours, delays report submission, introduces inconsistencies in report quality, and increases administrative workload. Supervisors repeatedly perform routine documentation tasks that could otherwise be automated, allowing them to dedicate more time to operational supervision, problem solving, and continuous improvement across all branches.

Therefore, there is a need for an intelligent web-based Report Builder system that eliminates the dependency on manually writing daily supervision reports using conventional document editing tools. The proposed system should enable an Area Supervisor to record one or more audio narrations describing all supervision activities performed during a specific day, regardless of whether the narration is structured or conversational. The system should accurately transcribe the recorded audio, allow the supervisor to review and edit the transcription when necessary, utilize an AI model optimized for Amharic language processing to analyze the transcription, and automatically generate a professional, well-structured daily supervision report that follows the organization's reporting format.

In addition to automating report generation, the system should provide centralized management of branches, daily reports, transcriptions, AI conversations, generated reports, report version history, user profile information, and reporting analytics through a unified web application. Reports should remain editable after generation, preserve historical versions, support supervision activities performed across multiple branches within a single working day, and be exportable in multiple formats such as PDF, TXT, CSV, and spreadsheet documents. By transforming the complete reporting workflow from manual documentation into an AI-assisted digital process, the proposed system will significantly improve reporting efficiency, enhance report consistency and accuracy, simplify branch and report management, reduce administrative workload, eliminate repetitive manual report writing, and enable Area Supervisors to perform their daily reporting responsibilities more effectively and efficiently.

The supervisor may perform the following activities at each branch:

- Check daily operational activities.
- Check cleanliness.
- Check employee readiness.
- Follow a checklist.
- Observe urgent branch problems.
- Communicate with staff or responsible people.
- Follow up on previously reported issues.
- Take action or give instructions.
- Form an opinion about branch performance.
- Identify things that need immediate attention.
- Identify things that can make the branch better.

At the end of each day, the report must explain:

- Date.
- Branch.
- Working time.
- Completed activities.
- Unresolved issues.
- General opinion.
- Work exit time.

The supervisor should not need to write the whole report manually after a long workday. Currently the process depends on Telegram, WhatsApp, Microsoft Word, or Google Docs.

The spoken explanation may not follow the final report order. The AI must organize it.

The conversation is always Amharic. The system must treat Amharic quality as a core requirement, not as an optional language feature.

The output must sound like the provided report samples.

English workplace terms must be represented in natural Amharic workplace transliteration, not literal translation.

The user must be able to review generated reports and request corrections. Corrections must update only the relevant part of the generated report without rewriting correct unrelated sections unnecessarily.

---

The supervisor provides a recorded Amharic audio explanation of the day. The app sends the audio to Addis AI speech-to-text to produce transcription. The transcription is expected to contain the needed information, but it will not be organized as a final report.

After transcription, the AI must process, extract, organize, and rewrite the information based on the required report rules, report format, tone, and system prompt.

The AI is responsible for:

- Extracting date information.
- Extracting branch names.
- Extracting working time and branch time ranges.
- Extracting performed activities.
- Extracting unresolved issues.
- Extracting urgent problems.
- Extracting actions already taken.
- Extracting general opinions.
- Organizing the extracted information into the required report format.
- Writing the report in Amharic.
- Matching the tone of the provided report samples.
- Correcting or updating the generated report when the user asks after review.

The AI must not treat the transcription as the final report. The transcription is only raw material. The generated report is the organized final output.

---

The generated report must follow this Amharic structure:

```text
ቀን: [ቀን]
ብራንች: [ብራንች ስም]
ስም: [ሙሉ ስም]
ስራ የገባሁበት ሰዓት: [ሰዓት]

የተሰሩ ስራዎች:
 - [ስራ 1]
 - [ስራ 2]
 - [ስራ 3]

መፍትሄ የሚፈሉ ጉዳዮች:
 - [ችግር 1]
 - [ችግር 2]

አጠቃላይ አስተያየት:
 - [አስተያየት 1]
 - [አስተያየት 2]

ከስራ የወጣሁበት ሰዓት፡ [ሰዓት]
```

The format must support one branch or multiple branches. When multiple branches are visited, the working time section should show the time range for each branch.

Example:

```text
ስራ የገባሁበት ሰዓት: 02:30
ከ02:30 - 07:40 መድኃኒዓለም ብራንች
ከ07:55 - 12:20 ኤርፖርት ብራንች
```

```text
ቀን: 29-10-18
ብራንች: መድኃኒዓለም / ኤርፖርት
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት: 2:30
ከ02:30 - 07:40 መድኃኒዓለም ብራንች
ከ07:55 - 12:20 ኤርፖርት ብራንች

የተሰሩ ስራዎች:
በመድኃኒዓለምና በኤርፖርት ቅርንጫፎች በቼክሊስቱ መሰረት የዕለት ተዕለት የአሰራር ሂደቶችን፣ የንፅህና ሁኔታዎችን እና የሰራተኞችን ዝግጁነት አረጋግጫለሁ።
በመድኃኒዓለም ብራንች ትናንት ሪፖርት የተደረጉት ሁሉም የጥገና ችግሮች አሁን ላይ ተስተካክለዋል።
በኤርፖርት ቅርንጫፍ የአዲሶቹ ሶፋዎች እግሮች መሰበራቸውን ለቶማስ አሳውቄው፤ እሱም ነገ ቴክኒሻን እንደሚልክ ገልጾልኛል።

መፍትሄ የሚፈሉ ጉዳዮች:
በኤርፖርት ቅርንጫፍ፡ የወንዶች ሎከር ጣሪያ አሁንም እያፈሰሰ ነው፤ ይህ ችግር ከዚህ ቀደም (13-10-18) ሪፖርት የተደረገ ሲሆን እልባት አላገኝም። በተጨማሪም በኪችን ውስጥ ያለው የጭስ ማስወጫ ኤግዝስት ፋን መጽዳት ይፈልጋል፣ የበርገር ሥጋው መጠኑ አነስተኛ ሲሆን ከዳቦ ጋር የተመጣጠነ አይደለም። ስለሆነም እነዚህ ችግሮች መፍትሄ እንዲያገኙ እጠይቃለሁ።

አጠቃላይ አስተያየት:
በሁለቱም ቅርንጫፎች የሥራ እንቅስቃሴው ጥሩ ነበር።

ከስራ የወጣሁበት ሰዓት: 12:20
```

```text
ቀን: 26-10-18
ብራንች: ኤርፖርት / መድኃኒዓለም / ቡልቡላ
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት:
ከ01:50 - 04:10 ኤርፖርት ብራንች
ከ04:20 - 07:30 መድኃኔዓለም ብራንች
ከ08:05 - 12:30 ቡልቡላ ብራንች

የተሰሩ ስራዎች:
በኤርፖርትና በመድኃኒዓለም ብራንቾች በቼክሊስቱ መሠረት የዕለት ተዕለት የአሠራር ሂደቶችን፣ የንፅህና ሁኔታዎችን እና የሠራተኞችን ዝግጁነት አረጋግጫለሁ።
በቡልቡላ ብራንች በተዘጋጀው የካሸሮች ሥልጠና ላይ ተሳትፌያለሁ።

መፍትሄ የሚፈሉ ጉዳዮች:
ለሳምቡሳ ዝግጅት የሚያስፈልጉ ግብዓቶች ስቶር ባለመኖራቸው፣ ወደ ብራንቹ ሳምቡሳ አልተላከም። ስለዚህ በተቻለ ፍጥነት ግብዓቶቹ እንዲሟሉ እጠይቃለሁ።
በመድኃኒዓለም ብራንች የግሪሉ ግማሽ ክፍል አይሠራም። በመሆኑም ማቲያስ በተቻለ ፍጥነት እንዲጠግነው ጥሪ አድርጌ ነበር፤ ነገር ግን ሥራ እንደበዛበት አስታውቆኛል፣ ቢሆንም አሁንም እንዲስተካከል እጠይቃለሁ።

አጠቃላይ አስተያየት:
በአጠቃላይ በሦስቱም ቅርንጫፎች የሥራ እንቅስቃሴው ጥሩ ነበር።

ከስራ የወጣሁበት ሰዓት: 12:30
```

```text
ቀን: 22-10-18
ብራንች: መድኃኒዓለም
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት: 01:55

የተሰሩ ስራዎች:
በቼክሊስቱ መሰረት በመድኃኒዓለም ቅርንጫፍ የሚከናወኑ መደበኛ የአሰራር ሂደቶች፣ የንፅህና አጠባበቅ ሁኔታ እና የሰራተኞች ዝግጁነት በተገቢው መልኩ መሆናቸውን አረጋግጫለሁ።
ኤፍሬም በህመም እረፍት ላይ ስለነበር የእሱን የሥራ ቦታ ሸፍኜያለሁ።

መፍትሄ የሚፈሉ ጉዳዮች:
በዋናው መግቢያ በር ላይ የሚቀመጠው ምንጣፍ (ካርፔት) እንዲገዛልን ቀደም ሲል ጠይቄ የነበረ ሲሆን አሁንም በተቻለ ፍጥነት እንዲሟላልን እጠይቃለሁ።

አጠቃላይ አስተያየት:
በአጠቃላይ የሥራ እንቅስቃሴው ጥሩ ነበር።

ከስራ የወጣሁበት ሰዓት: 09:30
```

The generated report must sound like the samples above. The tone should be:

- Professional.
- Direct.
- Clear.
- Work-report oriented.
- Written from the supervisor's perspective.
- Suitable to present to a boss.
- Natural in Amharic.
- Not overly decorative.
- Not conversational.
- Not casual.
- Not like a chatbot answer.

The AI must transform conversation into report language. For example, if the audio says something conversational like `እኔ ዛሬ መድኃኒዓለም ሄጄ ቼክሊስቱን አይቼ ነበር`, the report should not simply repeat the conversation. It should write in the report style:

```text
በቼክሊስቱ መሰረት በመድኃኒዓለም ቅርንጫፍ የሚከናወኑ መደበኛ የአሰራር ሂደቶችን አረጋግጫለሁ።
```

The AI must follow these rules when generating the report:

1. Generate the report in Amharic.
2. Use the exact section structure required by the report format.
3. Match the tone and writing style of the provided samples.
4. Use the reviewed transcription as the source of truth.
5. Do not invent missing dates, branch names, times, actions, people, problems, or opinions.
6. If required information is missing, leave it blank or mark it as not specified according to the chosen prompt rule.
7. Separate completed activities from unresolved issues.
8. Put urgent problems under `መፍትሄ የሚፈሉ ጉዳዮች`.
9. Put general branch opinion or improvement opinion under `አጠቃላይ አስተያየት`.
10. Preserve branch-specific details when multiple branches are mentioned.
11. Preserve time ranges per branch when the audio contains them.
12. Write from the supervisor's point of view.
13. Do not output an explanation of how the report was generated.
14. Do not include unrelated conversation content.
15. Do not include Person 2's questions unless the answer contains report information.
16. When the user asks for correction or update after review, update the report according to the user's instruction without changing unrelated correct content.

The audio conversation is Amharic, but it may include English or technical workplace words. The AI must not translate such words literally into unnatural Amharic. The AI must also not leave them in English spelling if the expected report style uses Amharic phonetic writing.

Instead, the AI must write English or technical words in the common Amharic workplace pronunciation/transliteration style. Example: if the audio mentions `deep fryer`, the report must not write `deep fryer` and must not translate it literally as `ጥልቅ መጥበሻ`. It must write `ዲፕ ፍራየር`. This rule applies to all English or technical words.

More examples:

- `locker` → `ሎከር`
- `kitchen` → `ኪችን`
- `exhaust fan` → `ኤግዝስት ፋን`
- `technician` → `ቴክኒሻን`
- `store` → `ስቶር`

The transcription is not the final report. The transcription is only the raw Amharic text version of the recorded conversation or spoken explanation. It may include repetition, unordered information, questions and answers, informal wording, clarifications, corrections, side comments, and mixed technical terms. When someone reads the transcription, they should be able to understand the information. But the transcription itself cannot be used directly as the report because it is not organized, polished, or formatted. The AI must process the transcription and convert it into the required report structure.

After the AI generates the report, the supervisor must be able to review it. If the supervisor says something like:

- `ይህን ችግር ወደ መፍትሄ የሚፈሉ ጉዳዮች አስገባው`
- `የመውጫ ሰዓቱን 12:30 አድርገው`
- `ይህን አስተያየት አጠቃላይ አስተያየት ውስጥ አስገባው`
- `ይህን ክፍል አጥፋው`
- `ቃሉን እንደዚህ ቀይረው`

The AI must update only the relevant part of the generated report. It must not rewrite correct unrelated sections unnecessarily.

The following example is conversational but contains necessary information:

```text
ቀን 09 11 18 ብራንች ጎላጉል እና ብስራተ ገብርኤል ብራንች ጎላጉል እና ብስራተ ገብርኤል ስም ቤዛ አያሌው ስም ቤዛ አያሌው ስራ የገባሁበት ሰዓት ከ አንድ ሰአት ከአምስት እስከ ሁለት ሰአት ከሃያ ጎላጉል ብራንች ከሶስት ሰአት ከ ሶስት ሰአት ከሰላሳ እስከ ዘጠኝ ሰአት ከሃያ በስራተ ገብርኤል ከዘጠኝ ሰአት ከሃምሳ አምስት እስከ አስራ ሁለት ሰአት ጎላጉል ብራንች የተሰራ ስራ በቴክ ሊስቱ መሰረት በቼክ ሊስቱ መሰረት በሁለቱም ብራንቾች የሚከናወኑ ስራዎችን በአግባቡ መሆናቸውን አረጋግጫለሁ። ሌላ የተሰራ ስራ አንዳንድ ሰራተኞች ብራንቹ የት ነበር? በጎላጎል ብራንድ ያሉ አንዳንድ ሰራተኞች ላይ የአሰራር ስርዓት ክፍተት ስለነበረ እነዚህ የአሰራር ስርዓት ያለባቸውን ሰራተኞችን እና ሱፐርቫይዘሩን ጨምሮ ያየሁትን የስራ አሰራር ክፍተት በድጋሚ እንዳይፈጽሙት መመሪያ ሰጥቻቸዋለሁ። በጎላጉል ቅርንጫፍ ማክሰኞ ሪፖርት ተደርጎ የነበረው የእቃ ማጠቢያ ሲንክ ድሬኔጅ እንዲስተካከል ጠይቄ የነበረው ማትያስ መጥቶ አስተካክሎታል። በብስራተ ገብርኤል ከዚህ በፊት ተጠይቆ የነበረው ኢንሴክት ኪለር በማትያስ አማካኝነት እንዲሰቀል አድርጌያለሁ።ሌላ ኢሹ ወይም አፋጣኝ መፍትሄ የሚፈልግ ጉዳዮች  አፋጣኝ መፍትሄ የሚፈልጉ ጉዳዮች በብስራተ ገብርኤል ያለው ዲፕ ፍራየር ኮንታክተር ችግር ነበረበት እሱ እንዲስተካከል ማትያስን አናግሬዋለሁ ስለዚህ ነገ መጥቶ ያስተካክለዋል ወይም እንደሚያስተካክለው አረጋግጦልኛል ሌላ በብስራተ ግብረ ኤል ያለ አፋጣኝ መፍትሄ የሚፈልግ ችግር በእግር ተረግጦ ኦፕሬት የሚደረግ እጅ መታጠቢያ አለ ይህ እጅ መታጠቢያ በቢውልዲንጉ ወይም ደግሞ በህንፃው ላይ ያሉ ሰራተኞች ወይም የሌላ ድርጅት ሰራተኞች አብረውን ስለሚጠቀሙ የከፍተኛ የሆነ የሳሙና እና የውሃ በክነት አለ የሆነ የሳሙና እና የውሃ ብክነት አለ። እጅ መታጠቢያውም ቶሎ ቶሎ እየተበላሸ ነው። ስለዚህ ይሄ ከህንፃው አሰራሮች ከህንፃው አሰራሮች ጋራ በመነጋገር አፋጣኝ መፍትሄ ይፈልጋል። እ ሌላ በጎላጉል ብራንች አፋጣኝ መፍትሄ የሚፈልግ ጉዳይ እ ሶኬት እና ማብሪያ ማጥፊያዎች የላሉ መስተካከል ያለባቸው ልክ ያልሆኑ አሉ። እነሱን እንደ እንዲያስተካክል ማቲያስን አናግሬው ነገ መጥቶ እንደሚያስተካክል አሳውቆኛል አጠቃላይ አስተያየት በሁለቱም ብራንቾች ያለው የስራ እንቅስቃሴ ጥሩ ነው
```

```text
ቀን: 09-11-18
ብራንች: ጎላጉል እና ብስራተ ገብርኤል ብራንች
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት:
ከ1:05 እስከ 2:20 በጎላጉል ብራንች
ከ3:30 እስከ 9:20 በብስራተ ገብርኤል ብራንች
ከ9:55 እስከ 12:00 በጎላጉል ብራንች

የተሰሩ ስራዎች:
በጎላጉል እና በብስራተ ገብርኤል ብራንቾች በቼክሊስቱ መሰረት የሚከናወኑ የዕለት ተዕለት ተግባራትን፣ የአሰራር ሂደቶችን፣ የንጽህና አጠባበቅ ሁኔታዎችን እና የሰራተኞችን ዝግጁነት ተከታትዬ አረጋግጫለሁ።
በጎላጉል ብራንች በአንዳንድ ሰራተኞች ላይ የአሰራር ስርዓት ክፍተት ስለነበረ፤ እነዚህን ሰራተኞች እና ሱፐርቫይዘሩን ጨምሮ ያየሁትን የስራ አሰራር ክፍተት በድጋሚ እንዳይፈጽሙ መመሪያ ሰጥቻቸዋለሁ።
በጎላጉል ብራንች ማክሰኞ ሪፖርት ተደርጎ የነበረውን የእቃ ማጠቢያ ሲንክ ድሬኔጅ (ሲንፎን) በማትያስ አማካኝነት እንዲስተካከል አድርጌያለሁ።
በብስራተ ገብርኤል ብራንች ከዚህ ቀደም ተጠይቆ የነበረውን ኢንሴክት ኪለር በማትያስ አማካኝነት እንዲሰቀል አድርጌያለሁ።

መፍትሄ የሚፈልጉ ጉዳዮች:
በብስራተ ገብርኤል ብራንች ያለው የዲፕ ፍራየር ኮንታክተር ተበላሽቶ ስለነበር ለማትያስ አሳውቄዋለሁ፤ ነገ መጥቶ እንደሚያስተካክለው አረጋግጦልኛል።
በብስራተ ገብርኤል በእግር ተረግጦ የሚሰራው የእጅ መታጠቢያ በህንፃው ላይ ባሉ የሌሎች ድርጅት ሰራተኞች ጭምር ጥቅም ላይ እየዋለ ይገኛል። በዚህም የተነሳ ከፍተኛ የሳሙና እና የውሃ ብክነት ከመኖሩም በላይ እጅ መታጠቢያው ቶሎ ቶሎ እየተበላሸ በመሆኑ፣ ከህንፃው አስተዳደር ጋር በመነጋገር አፋጣኝ መፍትሄ ሊሰጠው ይገባል።
በጎላጉል ብራንች የላሉ ሶኬቶች እና ማብሪያ ማጥፊያዎች ስላሉ ለማትያስ አሳውቄዋለሁ፤ ነገ መጥቶ እንደሚያስተካክል ነግሮኛል።

አጠቃላይ አስተያየት:
በአጠቃላይ በሁለቱም ብራንቾች ያለው የስራ እንቅስቃሴ ጥሩ ነው።

ከስራ የወጣሁበት ሰዓት: 12:00
```

---

- App shell, navigation, labels, buttons, validation messages, helper text, and everything else in the application interface must be English.
- Audio, transcription, AI chat, and report content can be Amharic, English, or mixed.
- Do not force translation unless the user explicitly chooses it.
- The conversation language in recorded audio is always Amharic.
- Addis AI is selected because it is specialized in Ethiopian Amharic language and is expected to produce more accurate transcription and report generation than general AI tools that are not focused on Ethiopian language use cases.

---

Transcription accuracy is the foundation of the entire product. Every subsequent step, including AI report generation, export, and review, depends on accurate transcription. Garbage transcription produces garbage reports.

Every implementation decision related to chunking strategy, format conversion, MIME type, error handling, and provider use must prioritize transcription accuracy over convenience, performance, or code simplicity. Convenience, performance, and code simplicity must also be perfect.

The chunking pipeline and correct MIME type per chunk are critical safeguards. Re-transcription must be available to verify accuracy on every audio recording.

Accuracy regression is a blocking defect. Any change to the STT pipeline, including chunking, format conversion, MIME type, language code, or provider endpoint, that degrades transcription quality must be reverted immediately. Accuracy must be verified with real Amharic audio before merging.

---

- Backend: Node.js, Express, Mongoose, ES Modules only (`"type": "module"`), no CommonJS, no `require()`.
- Initial backend packages are installed in `backend/package.json`.
- Required additional backend packages can be installed.
- Frontend: React 19, Vite 8, MUI 9, React Redux, Redux Toolkit, React Router 8, React Hook Form.
- Initial frontend packages are installed in `client/package.json`.
- Required additional frontend packages can be installed.
- JavaScript only.
- No TypeScript. No `.ts`. No `.tsx`. No TS config.
- No Next.js. No Remix. No other frameworks.
- No Tailwind CSS.
- Use MUI `sx` and `styled()` only.
- No automated test frameworks.
- No zod validation library — use manual resolvers with consistent error shape.
- HTTP client strategy: Addis AI calls use native `fetch` on the backend. All other service calls use axios. RTK Query uses `fetchBaseQuery` with `baseQueryWithReauth`.

- If package versions differ between notes and package manifests, `backend/package.json` and `client/package.json` are the source of truth.
- The packages are already installed.
- Other required packages can be installed if needed.

- All routes mounted under `/api/v1` in `app.js`.
- Each route module registered in `routes/index.js`.
- No routes registered directly in `app.js`.
- `routes/index.js` imports and mounts all route modules.
- New route modules must be created in `routes/`, imported, and mounted in `routes/index.js`.

- Error handling pipeline required.
- Fixed global security middleware stack order: `helmet -> cors -> compression -> cookie-parser -> mongo-sanitize -> rate-limit`.
- The security middleware stack must not be reordered or removed.
- All middleware must be present.

- One controller file per domain
- `express-async-handler` from npm, imported as `asyncHandler`, wraps all controller handlers.
- No custom async wrapper.
- All write controllers use `try/catch/finally` with MongoDB sessions and transactions:
  - `mongoose.startSession()`
  - `session.startTransaction()`
  - write
  - commit or abort
  - `session.endSession()` in `finally`
- All model hooks, instance methods, and static methods must support session where relevant.
- `backend/mock/*` data injection and wipe must support session.
- Read-only endpoints such as get and list do not need transactions.
- Controllers forward errors via `next(error)`, handled automatically by `express-async-handler` to the global error handler.

- Pagination uses `mongoose-paginate` on all list endpoints.
- Default page: `1`.
- Default limit: `10`.
- Max limit: `100`.

- Backend constants path: `backend/utils/constants.js`.
- Client constants path: `client/src/utils/constants.js`.
- No magic values anywhere.
- All constants objects are `Object.freeze()` frozen objects.
- New constants added to the relevant constants file, never hardcoded anywhere.
- All config via frozen `env` object from `config/env.js`.
- Never access `process.env` directly outside of `config/env.js`.
- All validation constants must be defined in the constants file, never hardcoded in validator files.

- Never hardcode numeric status codes.

- Graceful shutdown on `SIGINT` and `SIGTERM`:
  - `server.close()`
  - Clean up temporary audio chunk files (if not linked to any report)
  - `mongoose.connection.close()`
  - `process.exit(1)`
- Graceful shutdown must not be removed or replaced.
- HTTP server starts before database connection so the health endpoint is reachable without DB.

- All logging via `utils/logger.js`.
- Winston used on backend only. Morgan in development mode only.
- No `console.log` in backend code — absolute ban. Winston replaces it in all environments.
- Log levels: error, warn, info, http, verbose, debug, silly. Development: debug level. Production: info level.
- Module labels via Winston child loggers: Server, DB, Auth, AI-Addis, AI-Gemini, AI-Nvidia.
- Log files written to `logs/` directory (gitignored), rotated daily via Winston daily rotate file transport, auto-deleted after 30 days.
- Safe logging in production logs must not include passwords, JWT token values, raw cookies, API keys or secrets, raw audio file contents, full transcription texts, or full generated report texts. Use message IDs or truncated previews instead.
- AI provider logs: log provider, model, status code, and timing. Do not log request or response bodies in production.

- Validators check `express-validator` results.
- Validation failure returns `422`.
- Validators live in separate files under `validators/*.js`, one per domain.
- Validators are applied as middleware on route before controller handler.
- Auth email validators use `normalizeEmail({ gmail_remove_dots: false })`.

- No schema field combines `unique: true` with separate indexes.
- Use `schema.index(..)`.
- Schema hooks, instance methods, and static methods must accept session options where relevant.

---

- JWT-based authentication.
- Access token duration: `15m`.
- Refresh token duration: `7d`.
- Access token and refresh token stored in httpOnly cookies.
- Cookie options for both tokens:
  - `httpOnly: true`
  - `secure` in production
  - `sameSite: lax`
- Frontend uses `credentials: 'include'` on all calls, including public pages.
- `authenticate` middleware extracts JWT from `req.cookies.accessToken`.
- `authenticate` verifies the token, looks up the user, checks the user, and attaches the user document to `req.user`.
- `authenticate` uses `req.user._id.toString()` throughout, not `req.user.id`.
- Password hashing uses `bcryptjs` in a `pre('save')` hook with 12 salt rounds.
- `comparePassword(candidatePassword)` method uses `bcrypt.compare`.
- Plaintext passwords must never be compared.
- Refresh token rotated on each use to prevent replay.
- No sessions MongoDB collection — zero DB lookups for auth on each request.
- Registration form collects only `email` and `password`. No name field on the register form.
- On account creation, the backend auto-extracts `firstName` and `lastName` from the email local part (before `@`). For example, `beza@gmail.com` → `firstName=beza`, `lastName=beza`. Dotted local parts split: `beza.ayalew@gmail.com` → `firstName=beza`, `lastName=ayalew`.
- `avatar` and `position` are optional profile fields. The user updates them later from the Profile page, not during registration.
- Google OAuth registration uses Google-provided data instead of email extraction:
  - `firstName` and `lastName` extracted from Google profile name.
  - `email` taken from Google account email.
  - `avatar` taken from Google profile picture.
  - No password required for Google OAuth-created accounts.
  - Existing users matched by email and signed in; new users auto-created with Google data.
- Google OAuth button on login/register pages uses a Google icon start adornment and shows a loading spinner on click.
- Rate limiting three tiers:
  - Global: 100 requests per 15 minutes on all endpoints.
  - Auth: 20 requests per 15 minutes on register and login.
  - AI: 10 requests per 1 minute on generation and correction endpoints.

---

- React Router data mode via `createBrowserRouter` and `RouterProvider`.
- Routes defined as flat array in `main.jsx`.
- No separate `AppRoutes.jsx` unless the file becomes unmanageably large.
- All new protected routes go inside `ProtectedRoute` element's children array.
- All new public routes go inside `PublicLayout` element's children array.
- Routes defined in `client/src/main.jsx`, not `App.jsx`.
- Each module uses lazy loading inside `createBrowserRouter`.
- Inside `createBrowserRouter`, never use `element`; use `Component`.
- `App.jsx` serves as root layout with AppTheme, CssBaseline, AppErrorBoundary, AppToastContainer, and `<Outlet />`.
- `LocalizationProvider` with `AdapterDayjs` wraps router in `main.jsx`.

- All layouts use outer `height: 100vh; overflow: hidden`.
- Chrome is fixed.
- Content uses `overflow-y: auto`.
- Never scroll `body` or `html`.
- PublicLayout uses MuiAppbar (fixed) plus scrollable content area.
- Protected layout AppShell uses AppSidebar and a content area as siblings. MuiAppbar (as the protected top bar) sits **inside** the content area, NOT spanning across the sidebar.
- AppShell uses the same `height: 100vh; overflow: hidden` outer wrapper.
- Content area structure: MuiAppbar (64px) → Page Header (icon + title, one line) → `<Outlet />`.

- 2.1 PublicLayout
  - **File:** `client/src/components/layout/PublicLayout.jsx`
  - **Purpose:** Root-level wrapper for public routes (Landing, Login, Register). No sidebar, no auth gating.
  - **Structure (column flex):**
    1. `MuiAppbar` (`position="fixed"`, public variant — logo, theme toggle, Login/Sign Up buttons)
    2. `<Outlet />` — scrollable content area, `overflow-y: auto`
  - **Outer container:** `height: 100vh; overflow: hidden`
  - **Auth Awareness:** Reads Redux `authSlice` — renders Login/Sign Up when unauthenticated, Logout (icon + tooltip) when authenticated
  - **Props:** none (structural layout)
  - **Setup:**
    - Tree-shaken imports
    - `displayName` set to `"PublicLayout"`

- 2.2 AppShell
  - **File:** `client/src/components/layout/AppShell.jsx`
  - **Purpose:** Protected layout wrapper for all authenticated pages. Composes AppSidebar and MuiAppbar.
  - **Outer container:** `height: 100vh; overflow: hidden`
  - **Structure (horizontal flex):**
    - Left: `AppSidebar`
    - Right: content area — column flex:
      1. `MuiAppbar` (`position="static"`, 64px, protected variant — search icon, theme toggle, avatar dropdown)
      2. Page header — rendered by each page, not a reusable component
      3. `<Outlet />` — scrollable content, `overflow-y: auto`
  - **Responsive Behavior:** Inherits AppSidebar responsive drawer behavior; content area resizes to fill remaining width
  - **Props:** none (structural layout)
  - **Setup:**
    - Tree-shaken imports
    - `displayName` set to `"AppShell"`

- MuiAppbar sits at the top-right of the content area (beside the sidebar, not across it).
- Components (right-aligned): Search icon (opens GlobalSearchDialog), Theme toggle (LightMode/DarkMode), User avatar (opens dropdown: Profile + Logout).
- No title text. No hamburger in this bar (hamburger is in sidebar header).
- Height: 64px.
- Responsive avatar sizes: 32px below 600px, 36px above 600px.

- Sidebar header: Menu icon + Logo + App name "Report Builder". Menu icon toggles full/mini mode on permanent drawer.
- Nav items (top, `flexGrow: 1`): Dashboard, Reports, Branches, Profile. Each is a MuiListItemButton with icon + label.
- Bottom: MuiDivider + Logout (MuiListItemButton with icon + label).
- Responsive behavior:
  - `xs` (< 600px) and `sm` land (600-899px): Temporary overlay drawer, 240px, opens via sidebar header menu icon, closes on backdrop/nav select/Escape.
  - `md+` (≥ 900px) default: Permanent docked drawer, 240px, full icon + text.
  - `md+` after toggle: Permanent mini drawer, 64px, icons only (MuiTooltip on hover), header shows menu icon only.
- Nav item theming:
  - Default: `backgroundColor: transparent`, `color: text.secondary`.
  - Hover: `backgroundColor: action.hover`, `borderRadius: 8px`.
  - Selected: `backgroundColor: primary.main + 0.08`, `color: primary.main`, `fontWeight: 600`, `borderLeft: 3px solid primary.main`.
  - Icon selected: `color: primary.main`. Icon default: `color: action.active`.
  - Logout hover: `backgroundColor: error.main + 0.08`, `color: error.main`.
- Logout click dispatches `logout()` from RTK, clears cookies, navigates to `/login`.
- MuiAppbar logo navigates to `/dashboard` if authenticated, otherwise `/`.

- Opened by search icon in MuiAppbar. Closed by back arrow, Escape, or click outside.
- Full-screen on < 600px and < 768px land (no border radius, 100vh). Centered dialog on larger screens (600-1200px: 80vh/600px, > 1200px: 70vh/720px).
- Search input uses React Hook Form `register('search')`, fires on Enter or click (no debounce).
- Results grouped by entity type (Reports, Branches) in MuiAccordion sections. Empty state shows "No results found".

- 2.3 AppSidebar
  - **File:** `client/src/components/layout/AppSidebar.jsx`
  - **Purpose:** Navigation sidebar for protected layout. Dual-mode: temporary overlay on mobile, permanent docked on desktop (full or mini).
  - **Drawer:** Uses MUI `Drawer` with `variant` switching between `"temporary"` and `"permanent"`
  - **Sidebar Header:** Menu icon + Logo + App name "Report Builder". Menu icon toggles full/mini mode on permanent drawer.
  - **Nav Items (top, `flexGrow: 1`):** Dashboard, Reports, Branches, Profile. Each is a `MuiListItemButton` with icon and label.
  - **Bottom:** `MuiDivider` + Logout (`MuiListItemButton` with icon + label). Logout dispatches `logout()` from RTK, clears cookies, navigates to `/login`.
  - **Responsive Drawer Logic:**
    - `< 600px` and `sm` land (600–899px): Temporary overlay drawer, 240px. Opens via menu icon, closes on backdrop / nav select / Escape.
    - `md+` (>= 900px) default: Permanent docked drawer, 240px. Full icon + text.
    - `md+` toggled: Permanent mini drawer, 64px. Icons only, `MuiTooltip` on hover. Header shows menu icon only.
  - **Nav Item Theming:**
    - Default: `backgroundColor: transparent`, `color: text.secondary`
    - Hover: `backgroundColor: action.hover`, `borderRadius: 8px`
    - Selected: `backgroundColor: primary.main + 0.08`, `color: primary.main`, `fontWeight: 600`, `borderLeft: 3px solid primary.main`
    - Icon selected: `color: primary.main`; icon default: `color: action.active`
    - Logout hover: `backgroundColor: error.main + 0.08`, `color: error.main`
  - **Props:** `open` (boolean), `onClose` (function), `sidebarMode` (`"full"` | `"mini"`), `onToggle` (function)
  - **Setup:**
    - Tree-shaken imports
    - `displayName` set to `"AppSidebar"`

- `ProtectedRoute` shows spinner during `initializing`.
- `ProtectedRoute` redirects unauthenticated users with `<Navigate to="/login" state={{ from: location }}>`.
- `PublicRoute` is the inverse guard.
- `PublicRoute` redirects authenticated users to `/dashboard`.

```
createBrowserRouter([
  { path: '/', Component: App, ErrorBoundary: AppErrorPage, ...,
    children: [
      { Component: PublicRoute, children: [
        { Component: PublicLayout, children: [
         ..
        ]}
      ]},
      { Component: ProtectedRoute, children: [
        { Component: AppShell, children: [
         ...
        ]},
      ]},
    ]
  }
])
```

- Tree-shaking MUI imports required, for example `import TextField from '@mui/material/TextField'`.
- Never import from the `@mui/material` barrel.
- MUI Grid uses `size` prop, not `item`. Example: `<Grid size={{ xs: 12, md: 6 }}>`.
- Never use deprecated MUI props:
  - `margin="normal"` becomes `sx={{ mb: 2 }}`.
  - `InputProps` becomes `slotProps.input`.
  - `Link component="button"` becomes `Link slots={{ root: 'button' }}`.
- Use MUI `sx` and `styled()` for styling.
- Never use Tailwind.
- Never use inline `style`.
- `sx` uses theme-aware tokens such as `color: 'text.secondary'`, `bgcolor: 'background.paper'`, and `color: 'error.main'`.
- Never import from `themePrimitives.js` directly.
- For grey colors, use `theme.palette.grey[N]`.
- Never use `gray[50]`, `gray[800]`, or `brand[400]` directly.
- All `sx` color values must be mode-aware, such as `text.primary`, `background.default`, and `grey.500`.

- Reusable MUI components live in `client/src/components/reusable/*`.
- Reusable MUI components are prefixed with `Mui`.
- Input reusable components use `forwardRef`. Presentation wrappers do not need `forwardRef`.
- Set `displayName` on wrapped components.
- Default to `size="small"` where applicable, including TextField, Select, and Button.
- Pass through all standard MUI props.
- Wrappers are pure wrappers with no custom API surface.
- Use `slotProps.input` for input adornments, never `InputProps`.
- Every input element must have a proper start adornment.

- `MuiTextField`: Handles password type internally (no separate MuiPasswordField). Eye toggle via `useState` and `useCallback`. `onMouseDown` prevents focus loss. No layout shift. Merges caller's `slotProps.input.endAdornment`.
- `MuiButton`: Uses MUI native `loading`. Uses `loadingIndicator={<CircularProgress size={20} />}`. Uses `loadingPosition="center"`. Defaults `size="small"`.
- `MuiDialog`: Must pass or support `disableEnforceFocus` and `disableRestoreFocus`. Defaults both to `true`. Always use reusable `MuiDialog` instead of raw `@mui/material/Dialog`.
- `MuiConfirmDialog`: Preset confirmation dialog built on MuiDialog. Props: `open`, `onClose`, `onConfirm`, `title`, `message`, `confirmText`, `cancelText`, `confirmColor`. Used by MuiDataGrid archive/restore/delete flow and other confirm/dismiss scenarios.
- `MuiDataGrid`: Must have toolbar. Export selection required. Columns must be defined in `client/src/components/columns/*`. Action column includes tooltip and icon with proper color. Action column supports view, update, archive, restore, and delete. Archived item flow: archived -> MuiConfirmDialog -> restore or delete -> update UI. Server-side pagination. Skeleton loading rows.
- `MuiDatePicker`: Must explicitly switch between `DesktopDatePicker` on `md+` with popper and `MobileDatePicker` below `md` with dialog. Must use `theme.breakpoints.up('md')`. Never rely on DatePicker auto-switching.
- `MuiSelect`: Defaults `MenuProps={{ slotProps: { paper: { sx: { maxHeight: 300 } } } }}` for consistent dropdown height.
- `MuiPagination`: Defaults `color="primary"` and `shape="rounded"`. Used for list view pagination only.
- `GlobalSearchDialog`: Uses `react-hook-form` `useForm` with `register` for the search input. Search input is uncontrolled with no re-render on keystroke. Left arrow `ArrowBackIcon` start adornment clears field, resets results, and closes dialog.
- `LoadingSpinner`: Centered CircularProgress for full-page loading. Optional message prop.
- DataGrid action column icon colors use `sx` theme-path strings such as `'primary.main'`, `'warning.main'`, and `'error.main'`. Do not use the `color` prop on IconButton for DataGrid action column icon colors.
- Always use reusable components instead of raw `@mui/material/<component>` and put proper default props such as `size="small"` default.

- All theme configuration lives in `client/src/theme/`.
- Do not inline theme overrides in page components.
- Add component overrides via new files in `customizations/`.
- `AppTheme.jsx` composes full MUI theme with `createTheme`, `cssVariables`, color schemes, and all customizations.
- Theme customization files use `@module`, not `@file`.
- `AppTheme.jsx` uses `@module`.
- Theme customization files: inputs, dataDisplay, feedback, navigation, surfaces, dataGrid, datePickers, charts.

- All MUI X components, including charts, date picker, data grid, and any other MUI X component, are community version.
- MUI X Chat references: `https://mui.com/x/react-chat/` and `https://mui.com/x/react-chat/backend/adapters/`.

---

- 1.1 MuiAppbar
  - **File:** `client/src/components/reusable/MuiAppbar.jsx`
  - **Purpose:** Single reusable app bar configurable for both PublicLayout (full-width, top-level) and AppShell (inside content area, beside sidebar).
  - **Props:**
    - `position` — MUI AppBar position, default `"fixed"`
    - `elevation` — shadow depth, default `1`
    - `color` — MUI AppBar color prop, default `"inherit"`
    - `sx` — additional sx overrides
    - All standard MUI AppBar props passed through (pure wrapper, no custom API surface)
  - **Left Section:** Logo icon + app name. Click navigates to `/dashboard` if authenticated, `/` if not.
  - **Right Section:** Renders conditionally based on auth state.
  - **Public Layout Behavior:**
    - Full width (`width: 100%`)
    - `position="fixed"`
    - Unauthenticated: Theme toggle, Login button, Sign Up button
    - Authenticated: Theme toggle, Logout button (icon + tooltip)
  - **Protected Layout (AppShell) Behavior:**
    - Sits inside content area (NOT spanning across sidebar)
    - `position="static"`
    - Height: `64px`
    - No title text in the bar
    - Right section: Search icon (opens GlobalSearchDialog), Theme toggle, User avatar (dropdown: Profile + Logout)
    - Avatar sizes: `32px` below 600px, `36px` above 600px
  - **Auth Detection:** Reads auth state from Redux `authSlice` via `useSelector`
  - **Excluded from MuiAppbar:**
    - Search dialog content → handled via `GlobalSearchDialog`
    - User dropdown menu → rendered inline where used
    - Hamburger menu → handled by `AppSidebar` header
- 1.2 MuiButton
  - **File:** `client/src/components/reusable/MuiButton.jsx`
  - **Purpose:** Pure wrapper around MUI Button with safe defaults. Presentation wrapper — no `forwardRef` needed.
  - **Defaults:**
    - `size="small"`
    - `loadingIndicator={<CircularProgress size={20} />}`
    - `loadingPosition="center"`
    - Uses MUI native `loading` prop (not custom loading state)
  - **Prop Passthrough:** All standard MUI Button props pass through (`variant`, `color`, `disabled`, `onClick`, `type`, `startIcon`, `endIcon`, `sx`, `fullWidth`, etc.). Pure wrapper — no custom API surface.
  - **Setup:**
    - Tree-shaken import: `import Button from '@mui/material/Button'`
    - `displayName` set to `"MuiButton"`
  - **Variants (via passthrough):** `contained` (default), `outlined`, `text`
  - **Form Usage:**
    - Submit buttons use `type="submit"` and `size="small"`
    - `sx={{ flexShrink: 0 }}` to prevent shrinking
    - Disabled via `isSubmitting` from RHF `formState`
  - **Icon Rules:**
    - Icon-only buttons use raw `@mui/material/IconButton`, not MuiButton
    - Buttons with icons use standard `startIcon` / `endIcon` props
- 1.3 MuiDialog
  - **File:** `client/src/components/reusable/MuiDialog.jsx`
  - **Purpose:** Structural wrapper providing common dialog skeleton — title bar, scrollable content area, action buttons — with built-in dividers and responsive fullscreen. Always used instead of raw `@mui/material/Dialog`.
  - **Internal Structure:**
    - `<Dialog>` with defaults and passthrough props
    - `<DialogTitle>` with bottom `borderBottom` divider — rendered only if `title` prop is provided
    - `<DialogContent>` with `overflowY: auto` — the only scrollable section
    - `<Divider />` — rendered only if `actions` prop is provided
    - `<DialogActions>` — rendered only if `actions` prop is provided
  - **Props:**
    - `title` — string or ReactNode, rendered in DialogTitle with bottom divider
    - `children` — ReactNode, rendered inside scrollable DialogContent
    - `actions` — ReactNode, rendered inside DialogActions preceded by a Divider
    - `disableEnforceFocus` — default `true`
    - `disableRestoreFocus` — default `true`
    - All standard MUI Dialog props pass through (`open`, `onClose`, `maxWidth`, `fullWidth`, `fullScreen`, `scroll`, `PaperProps`, `sx`, `slotProps`, etc.)
  - **Responsive Fullscreen:**
    - Internal `useMediaQuery` checks `theme.breakpoints.down('sm')` OR `theme.breakpoints.down('md')` with landscape
    - When matched: `fullScreen={true}` — no border radius, 100vh
    - Overridable by caller passing explicit `fullScreen` prop
  - **MuiButton Integration:**
    - Caller provides MuiButton components inside the `actions` slot with proper props (e.g., `<MuiButton variant="outlined">Cancel</MuiButton>`)
    - Exception: GlobalSearchDialog (1.11) is a standalone component and does not use MuiDialog's actions slot
  - **Setup:**
    - Tree-shaken imports: `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Divider`
    - `displayName` set to `"MuiDialog"`
- 1.4 MuiTextField
  - **File:** `client/src/components/reusable/MuiTextField.jsx`
  - **Purpose:** Single reusable text input wrapping MUI TextField. Handles all text types including password (no separate MuiPasswordField). `forwardRef` for RHF `register` compatibility.
  - **Defaults:**
    - `size="small"`
    - Tree-shaken: `import TextField from '@mui/material/TextField'`
    - `displayName` set to `"MuiTextField"`
  - **forwardRef & RHF Integration:**
    - Wrapped with `forwardRef` so `register('fieldName')` works directly
    - Props: `name`, `label`, `error` (bool), `helperText` (string)
    - Caller connects: `error={!!errors.fieldName} helperText={errors.fieldName?.message}`
  - **Start Adornment (mandatory):**
    - Every instance must have a proper start adornment
    - Caller passes via `slotProps.input.startAdornment`
    - Uses `slotProps.input` — never deprecated `InputProps`
  - **End Adornment:**
    - Caller passes via `slotProps.input.endAdornment`
    - When `type="password"`, eye toggle is internally injected as end adornment
  - **Password Type Handling (replaces MuiPasswordField):**
    - When `type="password"`, internal `useState` toggles between `"password"` and `"text"`
    - Eye icon (`Visibility`/`VisibilityOff`) as end adornment
    - `onMouseDown` on eye icon prevents focus loss
    - No layout shift on toggle
    - Merges caller's `slotProps.input.endAdornment` after the eye icon
  - **Prop Passthrough:** All standard MUI TextField props: `type`, `placeholder`, `disabled`, `required`, `multiline`, `rows`, `maxRows`, `fullWidth`, `sx`, `slotProps`, etc. `type` defaults to `"text"`.
  - **Error Display:** `error` and `helperText` passed directly to MUI TextField.
  - **Validation:** No zod — manual validation with consistent error shape.
- 1.5 MuiSelect
  - **File:** `client/src/components/reusable/MuiSelect.jsx`
  - **Purpose:** Reusable select input wrapping MUI Select. `forwardRef` for RHF `register` compatibility.
  - **Defaults:**
    - `size="small"`
    - `MenuProps={{ slotProps: { paper: { sx: { maxHeight: 300 } } } }}` — consistent dropdown height
    - Tree-shaken: `import Select from '@mui/material/Select'`
    - `displayName` set to `"MuiSelect"`
  - **forwardRef & RHF Integration:**
    - Wrapped with `forwardRef` so `register('fieldName')` works directly
    - Props: `name`, `label`, `error` (bool), `helperText` (string), `value`, `onChange`
    - Caller connects: `error={!!errors.fieldName} helperText={errors.fieldName?.message}`
  - **Start Adornment (mandatory):**
    - Every instance must have a proper start adornment
    - Caller passes via `slotProps.input.startAdornment`
    - Uses `slotProps.input` — never deprecated `InputProps`
  - **Children (Options):** Caller provides `<MenuItem>` children rendered directly inside `<Select>`.
  - **Prop Passthrough:** All standard MUI Select props: `variant`, `placeholder`, `disabled`, `required`, `fullWidth`, `sx`, `displayEmpty`, `renderValue`, `slotProps`, etc.
  - **Error Display:** `error` and `helperText` passed directly to MUI Select.
  - **Validation:** No zod — manual validation with consistent error shape.
- 1.6 MuiDatePicker
  - **File:** `client/src/components/reusable/MuiDatePicker.jsx`
  - **Purpose:** Responsive date picker for Ethiopian dates with English day/month names. Always community version.
  - **Responsive Switching (explicit, never auto):**
    - `md+` (>=900px): `DesktopDatePicker` — popper mode
    - `<md` (<900px): `MobileDatePicker` — dialog mode
    - Uses `theme.breakpoints.up('md')` via `useMediaQuery`
    - Both imported tree-shaken from `@mui/x-date-pickers`
  - **Ethiopian Calendar Integration:**
    - Utility file: `client/src/utils/ethiopianDate.js`
      - `ethiopianToGregorian(ethDate)` → JS Date
      - `gregorianToEthiopian(jsDate)` → `{ day, month, year }`
    - Custom lightweight conversion (no external npm package)
    - Ethiopian year offset (~7-8 years behind Gregorian), 13-month structure
  - **Display Format:**
    - Input/display value: DD-MM-YY numeric (e.g., `25-02-18`)
    - Day names: English (Monday, Tuesday...)
    - Month names: English mapped to Ethiopian months (September...August + Pagume)
    - Achieved via custom `format` prop and view format
  - **RHF Integration (Controller required):**
    - Uses `Controller` because DatePicker uses custom onChange (documented with code comment)
    - Props: `name`, `control`, `label`, `error`, `helperText`
  - **Community Edition:**
    - `@mui/x-date-pickers` community only — no Pro features
    - `LocalizationProvider` + `AdapterDayjs` already wraps app in `main.jsx`
  - **Prop Passthrough:** `minDate`, `maxDate`, `disabled`, `slotProps`, `sx`, etc.
  - **Setup:**
    - Tree-shaken imports
    - `displayName` set to `"MuiDatePicker"`
- 1.7 MuiPagination
  - **File:** `client/src/components/reusable/MuiPagination.jsx`
  - **Purpose:** Pure wrapper around MUI Pagination with safe defaults. Used for list view pagination only (not DataGrid).
  - **Defaults:**
    - `color="primary"`
    - `shape="rounded"`
    - Tree-shaken: `import Pagination from '@mui/material/Pagination'`
    - `displayName` set to `"MuiPagination"`
  - **Props:**
    - `count` — total pages (from server response)
    - `page` — current page (from server response)
    - `onChange` — page change handler
    - All standard MUI Pagination props pass through
  - **Backend Integration:**
    - `count` = `totalPages` from server response (`mongoose-paginate` returns `totalPages` directly, no client-side calculation)
    - Constants: `PAGINATION_DEFAULT_PAGE=1`, `PAGINATION_DEFAULT_LIMIT=10`, `PAGINATION_MAX_LIMIT=100`
  - **Usage:** List views only. Parent manages page state via `useState` or Redux. Not used inside DataGrid.
- 1.8 MuiDataGrid
  - **File:** `client/src/components/reusable/MuiDataGrid.jsx`
  - **Package:** `@mui/x-data-grid` — community version only.
  - **Columns:** Defined per domain in `client/src/components/columns/*.js`. Each file exports a `columns` array. Action column is the last column in every domain column set.
  - **Action Column:**
    - View — `Visibility` icon, `sx={{ color: 'primary.main' }}`, tooltip "View", onClick navigates to `/${resource}/${id}` via `useNavigate`
    - Edit — `Edit` icon, `sx={{ color: 'warning.main' }}`, tooltip "Edit", onClick TBD
    - Archive/Delete — conditionally rendered:
      - Active items show `Archive` icon, `sx={{ color: 'text.secondary' }}`, tooltip "Archive"
      - Archived items show `Delete` icon, `sx={{ color: 'error.main' }}`, tooltip "Delete"
    - IconButton uses `sx` for color, never the `color` prop
    - Each action is an `IconButton` in `Tooltip` wrapper inside a `Stack direction="row"`
  - **Archive/Restore/Delete Flow:**
    - Archive click → `MuiConfirmDialog` → confirm → dispatch archive → update UI
    - Archived row shows restore and delete icons instead of archive
    - Restore click → `MuiConfirmDialog` → confirm → dispatch restore → update UI
    - Delete click → `MuiConfirmDialog` → confirm → dispatch permanent delete → update UI
  - **Export Selection:**
    - `checkboxSelection` enabled
    - `disableRowSelectionOnClick={true}`
    - Export button in toolbar for selected rows
  - **Toolbar:** Uses `GridToolbar` from `@mui/x-data-grid` (columns toggle, filter, density, CSV export).
  - **Server-Side Pagination:**
    - `paginationMode="server"`
    - `rowCount` from server's `totalDocs`
    - `onPaginationModelChange` handler
    - `pageSizeOptions={[10, 25, 50, 100]}`
    - Defaults: page=1, pageSize=10
  - **State Coverage:**
    - Loading: `loading` prop with skeleton via `slotProps={{ loadingOverlay: { variant: 'skeleton' } }}`
    - Empty: custom `slotProps={{ noRowsOverlay }}`
  - **Prop Passthrough:** `rows`, `columns`, `loading`, `rowCount`, `paginationModel`, `onPaginationModelChange`, `density`, `slots`, `slotProps`, etc.
  - **Setup:**
    - Tree-shaken imports
    - `displayName` set to `"MuiDataGrid"`
    - Default `sx={{ height: 400 }}` (overridable)
- 1.9 MuiConfirmDialog
  - **File:** `client/src/components/reusable/MuiConfirmDialog.jsx`
  - **Purpose:** Preset confirmation dialog built on MuiDialog. Used for archive/delete and other confirm/dismiss scenarios.
  - **Props:**
    - `open` — dialog visibility
    - `onClose` — dismiss handler
    - `onConfirm` — confirm action handler
    - `title` — dialog title (e.g., "Archive Report")
    - `message` — confirmation message (e.g., "Are you sure you want to archive this report?")
    - `confirmText` — confirm MuiButton label, default `"Confirm"`
    - `cancelText` — cancel MuiButton label, default `"Cancel"`
    - `confirmColor` — MuiButton color for confirm, default `"primary"` (overridable to `"error"` for delete)
  - **Structure:** Uses MuiDialog internally with title, message in content, and two MuiButtons in actions (Cancel + Confirm).
  - **Setup:** `displayName` set to `"MuiConfirmDialog"`
- 1.10 LoadingSpinner
  - **File:** `client/src/components/reusable/LoadingSpinner.jsx`
  - **Purpose:** Centered full-page or full-section loading indicator.
  - **Structure:**
    - Outer `Box` with `display: flex`, `alignItems: center`, `justifyContent: center`, full available dimensions
    - `CircularProgress` centered
    - Optional `message` rendered as `Typography` below the spinner
  - **Props:**
    - `message` — optional string, muted text beneath spinner
    - `size` — CircularProgress size, default `40`
    - `minHeight` — wrapper min-height, default `"100vh"` for full-page, overridable (e.g., `"400px"` for section-level)
    - All standard Box/CircularProgress props pass through
  - **Usage:** ProtectedRoute during `initializing`, page lazy-loading, section-level data fetch.
  - **Setup:**
    - Tree-shaken imports
    - `displayName` set to `"LoadingSpinner"`
- 1.11 GlobalSearchDialog
  - **File:** `client/src/components/reusable/GlobalSearchDialog.jsx`
  - **Purpose:** Global search across Reports and Branches. Opened from MuiAppbar search icon. Standalone — does not use MuiDialog's actions slot.
  - **Responsive Sizing:**
    - `< 600px` and `< 768px` land: full-screen (no border radius, 100vh)
    - `600-1200px`: centered dialog, 80vh / 600px
    - `> 1200px`: centered dialog, 70vh / 720px
    - Uses `Dialog` directly with `fullScreen` and `PaperProps.sx` for sizing
  - **Open/Close:** Opened via `open` prop from MuiAppbar search icon. Closed by back arrow, Escape, or click outside.
  - **Search Input:**
    - `useForm({ mode: 'onSubmit' })` with `register('search')`
    - Uncontrolled — no re-render on keystroke
    - Start adornment: `ArrowBackIcon` — clears field, resets results, closes dialog
    - Fires on Enter or search icon click (no debounce)
  - **Results Display:**
    - Grouped by entity type (Reports, Branches) in MuiAccordion sections
    - Each result navigates to detail page and closes dialog
    - Empty state: "No results found"
  - **Props:** `open`, `onClose`
  - **Setup:**
    - Tree-shaken imports
    - `displayName` set to `"GlobalSearchDialog"`
- 1.12 MuiPageHeader
  - **File:** `client/src/components/reusable/MuiPageHeader.jsx`
  - **Purpose:** Consistent page header for protected pages. Left side: title + subtitle (hidden on vw < 600 portrait). Right side: children slot for action elements.
  - **Structure:** Flex container, `justifyContent="space-between"`, `alignItems="center"`, `mb: 2`, bottom border 1px solid divider
  - **Props:** `title` (string, required), `subtitle` (string, optional), `children` (ReactNode, optional)
  - **Setup:** Tree-shaken imports, `displayName="MuiPageHeader"`
- 1.13 MuiStatusBadge
  - **File:** `client/src/components/reusable/MuiStatusBadge.jsx`
  - **Purpose:** Color-coded, non-interactive status chip for `report.status`. Read-only presentation — no click handling, no hover pointer.
  - **Structure:** MUI `Chip`, `size="small"`, `label={status}`, cursor stays default (no pointer). Never renders inside a button.
  - **Props:** `status` (string, required — one of `draft` | `audio_attached` | `transcribed` | `reviewed` | `completed`)
  - **Color mapping:**
    - `draft` → default
    - `audio_attached` → warning
    - `transcribed` → info
    - `reviewed` → primary
    - `completed` → success
  - **Usage:** Report Details header (3.6).
  - **Setup:** Tree-shaken imports, `displayName` set to `"MuiStatusBadge"`

- All forms use `react-hook-form` with `register` by default.
- Use `const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onBlur' })`.
- No `watch`. Use `getValues` in validate functions for cross-field validation.
- Use `register` by default. Use `Controller` only when `register` cannot work, such as MUI X DatePicker or TimePicker which use custom onChange values instead of native events. If `Controller` is used, document why with a code comment.
- For cross-field validation such as confirm password, use `validate: (value) => value === getValues('password') || 'Passwords must match'`.
- Use `formState.errors` for validation error display.
- Use MUI `error` and `helperText` props on wrapped components.
- Never debounce input. Never use `useDebounce`. Direct register integration only.
- Use `setError` for backend validation: `setError('fieldName', { message: error.data?.data?.errors?.[0]?.message })`.
- Submission: `handleSubmit(onSubmit)` with try/catch; `reset()` after success.
- Loading: `isSubmitting` from formState disables submit button and shows spinner.
- Schema validation via manual resolver with consistent error shape. No zod.
- All reusable Mui input components must use `forwardRef`.

---

- App shell, navigation, labels, buttons, validation messages, helper text, and everything else must be English.
- Audio, transcription, AI chat, and report content can be Amharic, English, or mixed.
- Do not force translation unless the user explicitly chooses it.
- Use `size="small"` on form submit buttons.
- Form submit buttons must not shrink on flex.
- Always use icons on `vw < 600`.
- Always use icons on `vw < 768 && landscape`.
- Text must not overflow or overlap at mobile or desktop widths.
- All text must use ellipsis after a certain character.

---

- `.env` files are gitignored and not committed.
- `.env` files exist locally with placeholder or correct values.
- No `.env.example` files.
- New env vars are added by:
  1. Adding to local `.env`.
  2. Adding field to config object in `config/env.js`.
  3. Adding validation/default logic in `config/env.js`.
- Never access `process.env` directly outside of `config/env.js`.
- Client env vars must be prefixed with `VITE_` and accessed via `import.meta.env.*`.

| Variable          | Required | Default                      | Description              |
| ----------------- | -------- | ---------------------------- | ------------------------ |
| VITE_API_BASE_URL | Yes      | http://localhost:4000/api/v1 | Backend API base URL     |
| VITE_APP_NAME     | Yes      | Report Builder               | Application display name |

- Addis AI API keys starting with `sk_` must never appear in client code.
- Addis AI API keys must never appear in Vite env vars sent to browser.
- Addis AI API keys must never appear in localStorage.
- Addis AI API keys must never appear in Redux state.
- Addis AI API keys must never appear in client logs.
- Nvidia and Gemini API keys are placed in `backend/.env` only.

Exported as a single `Object.freeze()` frozen object. Key groups:

- **Audio:** `AUDIO_MAX_DURATION_SEC=900`, `AUDIO_MAX_SIZE_BYTES=52428800` (50MB), `AUDIO_ALLOWED_MIME_TYPES=[audio/mpeg, audio/wav, audio/mp4, audio/webm]`
- **Pagination:** `PAGINATION_DEFAULT_PAGE=1`, `PAGINATION_DEFAULT_LIMIT=10`, `PAGINATION_MAX_LIMIT=100`
- **STT:** `ADDIS_AI_STT_MAX_DURATION_SEC=60`
- **Auth:** `BCRYPT_SALT_ROUNDS=12`
- **AI Generation:** `AI_TEMPERATURE=0.2`, `AI_MAX_OUTPUT_TOKENS=2048`, `AI_TOP_P=0.9`, `AI_TOP_K=40`
- **AI Correction:** `AI_CORRECTION_MAX_OUTPUT_TOKENS=2048`, `AI_CORRECTION_TEMPERATURE=0.15`

---

- `https://www.addisai.ch/`
- `https://docs.addisassistant.com/docs/get-started/introduction`
- `https://docs.addisassistant.com/docs/get-started/quickstart`
- `https://docs.addisassistant.com/docs/capabilities/text-generation`
- `https://docs.addisassistant.com/docs/capabilities/text-to-speech`
- `https://docs.addisassistant.com/docs/capabilities/speech-to-text`
- `https://docs.addisassistant.com/docs/capabilities/multimodal`
- `https://docs.addisassistant.com/docs/capabilities/realtime`
- `https://docs.addisassistant.com/docs/capabilities/translation`
- `https://docs.addisassistant.com/docs/integration/web`
- `https://docs.addisassistant.com/docs/integration/server`
- `https://docs.addisassistant.com/docs/integration/voice-interface`
- `https://docs.addisassistant.com/docs/platform/errors`

Addis AI provides African-language AI infrastructure for voice, chat, retrieval, translation, and localization. The platform supports voice AI, cross-lingual RAG, chat, speech-to-text, text-to-speech, translation, and enterprise deployments.

- Developer/API base URL: `https://api.addisassistant.com`
- Playground/dashboard: `https://platform.addisassistant.com`
- Realtime relay: `wss://relay.addisassistant.com/ws?apiKey=<API_KEY>`

- API keys are generated in the Addis AI dashboard.
- Secret keys start with `sk_`.
- REST authentication uses `x-api-key` header.
- The key must never be exposed in frontend code.
- The app must call Addis AI only from the backend.
- Backend-only proxy. No direct client-to-Addis AI calls.
- AI endpoints protected by authentication.
- Rate limits on auth and AI endpoints.

- Text model: `Addis-፩-አሌፍ`
- Voice models: `አሌፍ-Audio-AM`, `አሌፍ-Audio-OM`
- Realtime audio model: `አሌፍ-1.2-realtime-audio`

Current support includes English, Amharic, Afan Oromo, and Tigrinya. Text generation docs emphasize Amharic and Afan Oromo. STT docs specifically support Amharic and Afan Oromo. Translation supports bidirectional between Amharic `am`, Afan Oromo `om`, and English `en`. For this app, implement Amharic `am` and English-aware prompting as first-class. Keep language constants extensible for Oromo `om` and Tigrinya where appropriate.

Endpoint: `POST https://api.addisassistant.com/api/v1/chat_generate`

Request body is JSON:

```json
{
  "model": "Addis-፩-አሌፍ",
  "prompt": "string",
  "target_language": "am",
  "conversation_history": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ],
  "generation_config": {
    "temperature": 0.2,
    "maxOutputTokens": 2048,
    "topP": 0.9,
    "topK": 40
  }
}
```

Response shape:

```json
{
  "response_text": "The generated text response...",
  "finish_reason": "stop",
  "usage_metadata": {
    "prompt_token_count": 12,
    "candidates_token_count": 45,
    "total_token_count": 57
  },
  "modelVersion": "Addis-፩-አሌፍ"
}
```

Project use:

- Use this endpoint after the user reviews transcription.
- Use a strict report-generation prompt and ask for structured JSON-like output.
- Use low temperature, ideally `0.2`, for factual report generation.
- Keep AI keys only in backend `.env`.
- The backend HTTP client uses native `fetch` for Addis AI calls.

Endpoint: `POST https://api.addisassistant.com/api/stt`

Request is `multipart/form-data` with:

- `audio`: uploaded audio file.
- `request_data`: stringified JSON, for example `{ "language_code": "am" }`.

Response shape:

```json
{
  "status": "success",
  "data": {
    "transcription": "ሰላም እንኳን ደህና መጣችሁ",
    "usage_metadata": {
      "totalBilledDuration": "15s",
      "requestId": "69b60667-0000-2a1e-b6d3-d4f547fe6724"
    }
  },
  "confidence": 0.982
}
```

Supported audio formats: WAV (`audio/wav`, `audio/x-wav`, `audio/wave`), MP3 (`audio/mpeg`, `audio/mp3`), M4A (`audio/mp4`, `audio/x-m4a`), WebM (`audio/webm`).

Documented constraints:

- Max duration: 60 seconds per request, chunk by chunk.
- Max file size per request: 10 MB.
- Recommended sample rate: 16 kHz or higher. Mono preferred.
- Quiet environment and 10-30cm microphone distance recommended.
- Optimized for single-speaker audio.
- Overlapping voices and heavy code-switching may reduce accuracy.

Project use:

- Frontend imposes no duration limit.
- Backend chunks long WAV recordings before STT.
- Accuracy-critical pipeline: convert full audio to WAV via ffmpeg in a single pass using `pcm_s16le`, `16kHz`, mono, before PCM-level split.
- Per-segment re-encoding causes Opus decoder priming artifacts that degrade transcription quality.
- Error handling: network failure retry 3 times with exponential backoff (1s, 2s, 4s). Provider error (4xx, 5xx) marks the chunk as failed and continues processing remaining chunks.

Endpoint: `POST https://api.addisassistant.com/api/v1/audio`

Request body is JSON: `{ "text": "string", "language": "am", "voice_id": "male_1", "stream": false }`.

Response includes Base64 WAV audio, commonly under `audio`.

Project use: TTS is not required for the first report-builder workflow. Keep service support possible for later voice playback or AI chat.

Endpoint: `POST https://api.addisassistant.com/api/v1/chat_generate`

Request is `multipart/form-data` when attaching files: fields include `image` or `audio` and `request_data` (stringified JSON with `prompt`, `target_language`, and generation config).

Endpoint: `POST https://api.addisassistant.com/api/v1/translate`

Request body: `{ "text": "string", "source_language": "am", "target_language": "en" }`. Response nests translation under `data.translation`.

Project use: Optional. Do not translate by default because the report may be intentionally Amharic, English, or mixed. Consider a later UI control if the user wants final reports in a chosen target language.

Endpoint: `wss://relay.addisassistant.com/ws?apiKey=<API_KEY>`

Protocol: Client waits for `{ "setupComplete": true }`. Client sends base64 PCM16 audio chunks in JSON envelopes: `{ "data": "BASE64_ENCODED_PCM16_CHUNK", "mimeType": "audio/pcm;rate=16000" }`. Server returns base64 PCM16 audio under `serverContent.modelTurn.parts[0].inlineData.data`.

Project use: Do not expose secret keys in browser WebSocket URLs. Realtime is not required for the report creation workflow. If later implemented, use a backend-controlled strategy and verify whether Addis AI supports short-lived client tokens.

Error object: `{ "status": "error", "error": { "code": "invalid_api_key", "message": "...", "param": "optional" } }`.

Status codes:

- `400`: invalid request or missing field.
- `401`: missing or invalid API key.
- `403`: key lacks permission.
- `404`: endpoint or model missing.
- `429`: rate limit or quota.
- `500`: Addis AI server error.
- `503`: service overloaded.

Project handling:

- Map Addis AI errors to safe user messages.
- Log provider request IDs and status codes, not raw sensitive report content.
- Implement timeout. On network failure: retry 3 times with exponential backoff (1s, 2s, 4s). On provider error (4xx, 5xx): mark chunk as failed and continue.

- Use backend proxy only.
- Use native `fetch` in Node for Addis AI calls.
- Use `multer` for receiving browser audio uploads.
- Use Node `FormData`/`Blob` if available.
- If project Node version does not support reliable multipart forwarding, add a small documented multipart helper package.
- Do not install an Addis AI SDK unless official docs publish one. Docs currently say JavaScript/TypeScript SDKs are coming soon.

---

- In addition to Addis AI, Nvidia and Gemini will be used.
- STT always uses Addis AI.
- All AI providers used must be free, with no credit card or subscription required. Never use non-free AI.
- Nvidia and Gemini API keys are placed in `backend/.env`.
- Gemini model: `gemini-3.1-flash-lite`.
- Nvidia model: `deepseek flash 4` at least for now.
- Other free models can also be added.
- HTTP client for Gemini and Nvidia: use axios.
- All three providers available. Provider selected by user at generation time via dropdown or buttons. Default: Addis.
- Provider stored per AI conversation message. Different providers can be used for corrections versus initial generation.
- Provider fallback chain: Addis → Gemini → Nvidia.

Model: `gemini-3.1-flash-lite`. Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`. Request: `{ contents: [{ role, parts: [{ text }] }], systemInstruction: { parts: [{ text }] }, generationConfig: { temperature: 0.2, maxOutputTokens: 2048, topP: 0.9, topK: 40 } }`. No streaming. Error handling: network failure retry 3 times with exponential backoff; provider error returns 502.

Model: `deepseek flash 4`. Uses Nvidia API message format with `Authorization: Bearer` token. Same retry pattern as Gemini.

---

- Max duration: 15 minutes per clip (configurable via `AUDIO_MAX_DURATION_SEC` in constants).
- Max file size: 50 MB per clip (configurable via `AUDIO_MAX_SIZE_BYTES` in constants).
- Limits enforced client-side after recording stops.
- If `blob.size > 50 MB`, submit is blocked, warning is shown, and user is asked to re-record.
- Long recordings exceeding STT per-request duration of 60 seconds are chunked by backend before STT.
- Frontend records audio as clips, each added to an array in local state. User submits the full array as `multipart/form-data` (field name `'clips'`).
- Audio blob uses component-local state with `useState` and `useRef` in a custom hook.
- Audio blob is not persisted to Redux, redux-persist, or localStorage.
- MIME type priority:
  - `audio/webm;codecs=opus`
  - `audio/webm`
  - `audio/mp4`
  - browser default

- At least one audio clip is required.
- Max file size is 50 MB (configurable).
- Allowed MIME types must be validated.
- Duration metadata is informational.
- Duration is validated server-side via ffprobe.
- Audio type and size are validated server-side.

- Use `multer` for receiving browser audio uploads.
- Audio stored temporarily under `backend/uploads/audio/`.
- `backend/uploads/audio/` uses `.gitignore`.
- Uploaded files are not committed.

The only approved chunking pipeline for STT is:

1. ffmpeg full-file WAV conversion using `pcm_s16le`, `16kHz`, mono.
2. In-memory PCM-level WAV split via `wavSplitter.js` (60-second chunks, configurable via `ADDIS_AI_STT_MAX_DURATION_SEC` in constants).
3. Each chunk MIME type: `audio/wav` — never `audio/webm` for chunks.

Any alternative chunking approach that degrades accuracy is forbidden unless proven equivalent. Per-segment ffmpeg re-encoding causes Opus decoder priming artifacts that degrade transcription quality.

Re-transcription must be available so accuracy can be verified across multiple attempts. Backend must accept both `audio_recorded` and `transcribed` statuses. Frontend must show a "Re-transcribe" button on completed transcription.

---

System message: "You are an expert report writer for a restaurant company's supervision department. Generate structured daily supervision reports in Amharic based on field note transcriptions."

Parameters: temperature `0.2`, maxOutputTokens `2048`.

System message: "You are an expert report editor. The user has provided corrections to a previously generated report. Incorporate the corrections while maintaining the original structure and style."

Parameters: temperature `0.15`, maxOutputTokens `2048`.

Correction audio → STT → correction text → used in same correction prompt.

Uses the system to fix transcription errors (fill gaps, fix misrecognized words). Returns corrected text as `aiCorrectedText` in the Transcription model.

The AI prompt must enforce these rules:

1. Generate the report in Amharic.
2. Use exact section structure: ቀን, ብራንች, ስም, ስራ የገባሁበት ሰዓት, የተሰሩ ስራዎች, መፍትሄ የሚፈሉ ጉዳዮች, አጠቃላይ አስተያየት, ከስራ የወጣሁበት ሰዓት.
3. Match tone and writing style of provided samples: professional, direct, clear, work-report oriented, supervisor perspective.
4. Use reviewed transcription as source of truth.
5. Do not invent missing information.
6. If required information is missing, leave blank or mark as not specified.
7. Separate completed activities from unresolved issues.
8. Preserve branch-specific details for multi-branch reports.
9. Preserve time ranges per branch.
10. Write from supervisor's point of view.
11. Do not output explanation of how report was generated.
12. Do not include unrelated conversation content.
13. For corrections: update only relevant part, do not rewrite correct unrelated sections.
14. English or technical words must use Amharic workplace transliteration (example: `deep fryer` → `ዲፕ ፍራየር`).

---

Reports should be exportable in multiple formats. PDF, TXT, CSV, and XLSX export is client-side only. Google Docs export is backend-only: the document is created directly in the user's own Google Drive with the user's own Google OAuth token.

- **PDF:** `jspdf` with `jspdf-autotable`. A4 format. Noto Sans Ethiopic font for Amharic text. Section headers. Page numbers.
- **TXT:** Blob with UTF-8 encoding. Plain structure preserving report format.
- **CSV:** Blob with UTF-8 with BOM for Excel compatibility. Structured columns.
- **XLSX:** Multi-sheet workbook: content sheet (report), version history sheet (all versions with metadata), metadata sheet (provider, dates, status).
- **Google drive api:** Backend uses the Google Docs API with the user's own Google OAuth token (the Google login flow, extended with the `drive.file` scope) to create a document from the generated report content directly in the user's own Google Drive. The user owns the document and can edit, share, download, or move it freely — no sharing-permission step is needed. Returns the document URL. Frontend opens the URL in a new tab. The user's token is stored and refreshed server-side only. (Phase 25 user decision: replaced the earlier Google Service Account approach, which cannot place files in a user's Drive.)

`jspdf` and `jspdf-autotable` are already installed in the client package list.

---

- ES Modules only throughout backend (`import`/`export`, never `require()`/`module.exports`).
- Backend package must use `"type": "module"`.
- No console.log in backend code. Winston replaces it in all environments. Allowed in frontend.
- No zod validation library — use manual resolvers with consistent error shape.
- Semicolons required. Single quotes. Trailing commas. 2-space indentation. 100 character width. LF line endings. UTF-8 encoding.
- camelCase for variables and functions. PascalCase for classes and components. kebab-case for file names. UPPER_SNAKE_CASE for constants and environment variables.
- Import order: built-in modules → npm packages → local modules (alphabetical within groups).
- Named imports for utilities and functions. Default import for React components. Never use `*` imports.
- JSDoc on all public modules with `@module`. JSDoc on functions with `@param`, `@returns`, and `@throws`. JSDoc on constants with `@type`. JSDoc on exports.
- JSDoc block comments on every single file or module.
- Unused parameters use `_` prefix, for example `_req`, `_res`, `_next`, to signal intentional non-use.
- No unused imports. Every `import X from Y` must be referenced in the file body.
- No unused exports. Every exported function or constant must be imported elsewhere.
- No dead code. Remove unused constants, variables, and methods.
- Functional components with hooks. Props destructured in function signature. Event handlers prefixed with `handle`.
- `req.user._id.toString()` pattern for user ID.
- Frontend must pass `npx vite build` with 0 errors.
- Frontend must also pass lint.

---

- Module-level: `@module path/name` at top of each file.
- Function-level: `@param {type} name - description`, `@returns {type}`, and `@throws {ErrorType} reason` where applicable.
- Constants: `@type {TypeDefinition}` on exported constants.
- Theme customizations: use `@module`, not `@file`.
- `AppTheme.jsx`: use `@module`.
- Express types: `import('express').Request`, `import('express').Response`, `import('express').NextFunction`.
- Mongoose middleware types: `@returns {Promise<void>}` for async middleware.
- Component JSDoc: `@param {Object} props` with name, label, error, helperText, control props documented.
- Model JSDoc: `@typedef {Object} ModelName` with `@property {Type} fieldName - description`.
- Middleware JSDoc: `@param {import('express').Request} req`, `@param {import('express').Response} res`, `@param {import('express').NextFunction} next`.
- Types: No TypeScript, so JSDoc provides type documentation. Use `@typedef` for object shapes, `@param {Object}` with destructured properties, `@returns {Promise<Type>}` for async functions.

---

- Global error handler distinguishes operational `CustomError` from unexpected errors.
- `CustomError` class with `statusCode`, `message`, and `isOperational` properties.
- `notFound.middleware.js` catches unmatched routes, creates `CustomError(404, ..)`, and forwards via `next()`.
- Validation errors return `422`.
- All async controllers wrapped with `express-async-handler`.
- Global error handler: Development returns full stack trace. Production returns generic message and logs programmer errors.

RTK Query `baseQueryWithReauth`: on 401 → `POST /api/v1/auth/refresh` → if refresh succeeds, retry original request (cookies set automatically) → if refresh fails, clear auth state, redirect to login.

`AppErrorBoundary`: class component catching React render errors, showing fallback UI.

---

- `.env` files in `.gitignore`. Never committed. No `.env.example` files.
- All API keys stored only in `backend/.env`.
- All service calls proxied through backend — never called directly from frontend.
- No API keys in frontend code, Vite env vars, localStorage, Redux state, or client logs.

- Two-token system with httpOnly cookies.
- Access token: 15min TTL, path `/`, signed with `JWT_ACCESS_SECRET`.
- Refresh token: 7d TTL, path `/api/v1`, signed with `JWT_REFRESH_SECRET`.
- Tokens never exposed to JavaScript (httpOnly prevents XSS token theft).
- Refresh token rotated on each use (prevents replay).
- `secure` flag in production, `sameSite: lax`.
- No sessions MongoDB collection — zero DB lookups for auth on each request.

CORS origin configured via `CLIENT_ORIGIN` env var (default: `http://localhost:3000`). `credentials: true` to allow cookies.

Three tiers:

| Limiter | Window     | Max Requests | Applied To                      |
| ------- | ---------- | ------------ | ------------------------------- |
| Global  | 15 minutes | 100          | All endpoints                   |
| Auth    | 15 minutes | 20           | /auth/register, /auth/login     |
| AI      | 1 minute   | 10           | Generation/correction endpoints |

`helmet → cors → compression → cookie-parser → mongo-sanitize → rate-limit`

This order is intentional and must not be changed:

1. helmet — Security headers first.
2. cors — Cross-origin before cookie parsing.
3. compression — Compress responses with gzip.
4. cookie-parser — Parse cookies before route handlers.
5. mongo-sanitize — Strip `$` and `.` from request data before it reaches controllers.
6. rate-limit — Global rate limiting before API routes.

All inputs validated using `express-validator`. Validation errors return 422.

Server-side MIME type check, file size check, duration validation via ffprobe.

In production, logs must never include: passwords, JWT token values, raw cookies, API keys or secrets, raw audio file contents, full transcription texts, or full generated report texts. Use message IDs or truncated previews instead.

All multi-document write operations use Mongoose sessions with transactions. Pattern: `startSession → startTransaction → writes → commitTransaction → catch → abortTransaction → finally → endSession`.

Algorithm: `bcryptjs`. Salt rounds: 12. Plaintext passwords never compared — always use `User.comparePassword()`. Password field excluded from JSON serialization.

On `SIGINT`/`SIGTERM`: `server.close()` → cleanup temp audio files → `mongoose.connection.close()` → `process.exit(1)`. Force exit after 30 seconds if shutdown hangs.

---

- Never write new files unless explicitly required by the phase.
- When creating new files, understand existing code conventions first.
- Mimic code style.
- Use existing libraries.
- Follow existing patterns.
- Never proactively create documentation files (`*.md`) or README files unless explicitly requested.
- Never add code explanation summaries unless requested.
- Never create placeholder, stub, or boilerplate files without explicit request.
- Verify a file does not already exist before creating it.
- After working on a file, just stop.

---

- Run `node --check` on all backend files after changes.
- Run `npx vite build` on client after changes with 0 errors.
- Always delete `dist/*` after checking build.
- Check every file for unused imports.
- Check every file for unused variables.
- Check every file for unused parameters.
- Check every file for missing JSDoc.
- No hardcoded magic values. Everything must be in `constants.js` or config.
- No deprecated MUI props.
- Check all new components.

Build commands:

| Environment    | Command                    | Description                    |
| -------------- | -------------------------- | ------------------------------ |
| Backend dev    | `npm run dev` (backend)    | nodemon server.js on port 4000 |
| Backend prod   | `npm start` (backend)      | Production start               |
| Backend check  | `node --check`             | Syntax validation              |
| Frontend dev   | `npm run dev` (client)     | Vite on port 3000              |
| Frontend build | `npm run build` (client)   | Vite production build          |
| Frontend lint  | `npx eslint src/` (client) | ESLint                         |

---

- Every phase starts with a feature branch named `phase-N-description`.
- No direct commits to `main`.
- Phase protocol has 6 steps in order:
  1. Pre-Git: check status and create feature branch.
  2. Deep codebase analysis.
  3. Analysis of all prior phases.
  4. Phase execution and validation.
  5. User review and explicit approval.
  6. Post-Git: stage, commit, push, merge, and delete branch.
- Never proceed to Step 6 without explicit user approval.
- Commit messages: `feat: phase N description` for feature phases, `chore: phase N description` for hardening.
- No amending after push.
- Merge feature branch into `main` after approval.
- Delete both local and remote feature branches after verifying merge.

1. Check current state: `git status` to check current branch name, uncommitted changes, and untracked files. `git branch -vv` to display all local branches and tracking information.
2. Update remote information: `git fetch origin`.
3. Handle uncommitted changes: If uncommitted changes exist, stage, commit, push, merge, and delete feature branch. Verify branch names and merge targets.
4. Synchronize local with remote: If local branch is behind remote, `git pull origin <branch>`. If merge conflicts are detected, halt immediately and prompt user.
5. Create feature branch: `git checkout -b <descriptive-branch-name>`. Use clear, descriptive branch names matching phase number.
6. Verify clean state: `git status` to confirm clean working directory.

Capture every detail of the codebase to ensure absolute alignment with requirements, designs, specifications, and constraints. Critical analysis areas: codebase deep dive, specification analysis, requirements, design, constraints, phases, analysis outcome.

1. Identify all previous phases.
2. Analyze each previous phase.
3. Perform consistency verification.
4. Perform gap analysis.
5. Produce analysis outcome.

Implement the phase with absolute adherence to requirements, designs, specifications, and constraints. Mandatory compliance: requirements, design, code. Validation: validate implementation using documented rules. Each implementation phase must result in meaningful, visible changes.

1. Present implementation.
2. Request functionality review.
3. Handle feedback: If user requests changes, apply required updates. If user approves without changes, confirm explicit approval and proceed to Step 6.
4. Verification before proceeding: Ensure user has explicitly stated approval. Confirm no additional changes are needed. Get clear go-ahead for Git operations.

5. Verify current state: `git status`, `git branch -vv`, `git fetch origin`.
6. Stage and commit changes: Review all changes with `git diff`. Stage with `git add .`. Verify with `git status`. Commit with descriptive message.
7. Push feature branch: `git push origin <feature-branch>`. Verify push success.
8. Checkout base branch: Checkout `main`, pull latest changes with `git pull origin main`.
9. Merge feature branch: `git merge <feature-branch>`. If merge conflicts occur, halt immediately and prompt user.
10. Push merged changes: `git push origin main`.
11. Delete feature branch locally and remotely: Verify merge success. `git branch -d <feature-branch>` local, `git push origin --delete <feature-branch>` remote.
12. Final synchronization verification: `git status` clean. `git branch -vv` shows main in sync. `git log --oneline -5` shows recent commit.
13. Cleanup verification: No orphaned branches, no uncommitted changes, correct branch.

This protocol is mandatory for every phase. No shortcuts allowed. No exceptions permitted. All six steps must be completed in order. Each step must be verified before proceeding to the next. User approval required before Step 6.

---

- **ADR-001:** Amharic-First Stack — Addis STT-only, user-selectable text generation across Addis/Gemini/Nvidia.
- **ADR-002:** Backend-Only Proxy for all providers.
- **ADR-003:** Status Machine (states, forward + explicit backward transitions).
- **ADR-004:** Dual-Token JWT httpOnly (access 15min + refresh 7d rotated).
- **ADR-005:** Unified ReportVersion (replaces separate GeneratedReport + ReportVersion).
- **ADR-006:** Client-Side Export Only for PDF/TXT/CSV/XLSX; Google Docs is backend-only.
- **ADR-007:** ffmpeg + wavSplitter Chunking Pipeline (accuracy-critical).
- **ADR-008:** Hybrid HTTP Clients (fetch for Addis, axios for others).
- **ADR-009:** Self-Service Registration (single user type, no RBAC).
- **ADR-010:** Multi-Branch Report Support.
- **ADR-011:** Ethiopian Calendar Display (numeric notation, English UI).
- **ADR-012:** MUI Community Edition Only (no licensed MUI X Pro).
- **ADR-013:** Graceful Shutdown Protocol.
- **ADR-014:** Provider Fallback Chain (Addis → Gemini → Nvidia).
- **ADR-015:** Two-Path Deletion Lifecycle (archive → permanent delete).
- **ADR-016:** Error Handling Strategy (CustomError class, global handler, 422 for validation).
- **ADR-017:** Transform Layer for API Responses (DTO mapping).
- **ADR-018:** Session-Based Transactions for All Write Operations.
- **ADR-019:** Safe Logging Policy (Winston, no console.log in backend).
- **ADR-020:** Frozen Config and Constants Objects.
- **ADR-021:** JSDoc as Documentation Standard.
- **ADR-022:** ES Modules Enforced Throughout (no CommonJS).
- **ADR-023:** MUI X Chat for Correction Interface.
- **ADR-024:** Google OAuth Stubbed Implementation.
- **ADR-025:** React Router Data Mode with Lazy Loading.
- **ADR-026:** Redux Toolkit with injectEndpoints Pattern.
- **ADR-027:** 8-Phase Implementation Plan (Foundation through Polish).
- **ADR-028:** Feature Branch Git Strategy per Phase.
- **ADR-029:** Rate Limiting Strategy (global, auth, AI tiers).
- **ADR-030:** Re-transcription and AI-Transcription-Correction Support.
- **ADR-031:** Provider-Neutral OAuth Service Architecture.
- **ADR-032:** Ethiopian Date Display Using Numeric Notation Only.
- **ADR-033:** Per-Component State Coverage (loading, error, empty, success).
- **ADR-034:** Client-Side Pagination for DataGrid (server-side via mongoose-paginate).
- **ADR-035:** Fixed Middleware Stack Order (not reorderable).
- **ADR-036:** No Roles/RBAC — Single User Type.
- **ADR-037:** Mock Data Seeding Strategy (metadata-only audio clips).

---

Every archivable resource (Report (24.4), Branch (24.8)) follows the two-path deletion lifecycle. Archiving is always the first step; permanent deletion is only reachable from the archived state.

```
Path 1 (user-initiated):  Active → Archive → User clicks Delete → MuiConfirmDialog → Cascade hard-delete
Path 2 (automatic):       Active → Archive → 30-day wait → Auto cascade hard-delete
```

- **Archive** — the resource is marked `isArchived: true` and `archivedAt` is set to the current time. An archived resource is hidden from selection lists (branch picker, global search, default list queries). All list and selection endpoints default to returning only active resources (`isArchived: false`) unless the caller explicitly requests archived ones (the Reports list endpoint already supports an explicit `isArchived` query parameter (12.6)).
- **Restore** — the resource is put back into active use: `isArchived: false` and `archivedAt: null`. Restore is only possible while the resource is archived and before the 30-day deletion deadline (35.4) and (35.6). It cannot be invoked on an active resource.
- **Permanent delete** — a cascade hard-delete that removes the resource and all of its dependents (35.2). It is never reachable from the active state; it only runs after archive, through Path 1 or Path 2.

- **Report** cascade hard-delete removes, in one transaction:
  - the Report document itself (including its embedded `generatedHistory`)
  - its Transcription document (24.6)
  - its Audio documents (24.5) plus their physical files on disk (`filePath`)
  - all ChatConversation documents linked to the report (24.9)
- **Branch** cascade hard-delete removes only the Branch document (24.8). Reports that reference the branch are **never** deleted: branch data is embedded in each report's `branches[]` entries (branchId + name snapshot) and remains fully readable (12.6).
- No other model is archivable. A model becomes archivable only when it is explicitly added here, gains `isArchived` / `archivedAt` fields, a TTL-compatible `archivedAt` index, and the same lifecycle.

Guards are checked in this order inside every archive / restore / delete controller:

1. Resource exists — else 404 `{ success: false, message: "Report not found" | "Branch not found", data: null }` (existing 404 wording (12.6)).
2. Lifecycle precondition (else 409 Conflict, `{ success: false, message, data: null }`):
   - Archive an already-archived resource → `"Report is already archived"` / `"Branch is already archived"`
   - Restore a non-archived resource → `"Report is not archived"` / `"Branch is not archived"`
   - Delete a non-archived resource → `"Archive the report before deleting"` / `"Archive the branch before deleting"`
   - Restore a resource whose 30-day deadline has already passed → `"Report can no longer be restored; the 30-day deletion window has passed"` / `"Branch can no longer be restored; the 30-day deletion window has passed"`
3. Proceed with the operation.

- 409 is already an established code in this project (duplicate key 11000, register duplicate email). Status codes are imported from `utils/httpStatus.js` by semantic name; add `CONFLICT: 409` there if it is not already present (10.6).
- Archived-state blocking for other operations is unchanged: operating on an archived resource that is not archive/restore/delete returns 403 (e.g. generate (12.6)).
- The automatic path deletes the same way as Path 1 but is triggered by the sweeper (35.6), never by the user.

- Archive, restore, and cascade delete always run inside a Mongoose session with a transaction: `startSession → startTransaction → writes → commitTransaction → catch → abortTransaction → finally → endSession` (10.3) and (29.10); ADR-018.
- Model hooks, instance methods, and static methods used by these flows accept a `session` option where relevant (10.11).
- Cascade delete executes inside a single transaction: all dependents (35.2) and the parent document are removed together — no partial deletes.
- Physical audio file removal (`fs.unlink` of each deleted `Audio.filePath`) runs **after** `commitTransaction`, as best-effort post-commit cleanup. File removal failures never roll back or block the transaction; they are logged via Winston (`logger.warn`) and retried by the orphan sweep (35.6). This is the only step of the flow that is not transactional.
- Read-only endpoints (get, list) do not need transactions (10.3).

- The deadline for every archived resource is `archivedAt + 30 days` (30 × 24 × 60 × 60 = 2592000 seconds, the same value used by the TTL indexes (24.4) and (24.8)).
- An app-level **cleanup sweeper** enforces the automatic path:
  - Runs periodically on an interval defined in `backend/utils/constants.js` (10.5) — no magic values; a per-hour run is the default.
  - Started alongside the HTTP server and stopped during graceful shutdown (10.8).
  - **Expired sweep** — finds resources with `isArchived: true` and `archivedAt` at or before the deadline, then performs the same cascade delete (35.5) for each one, each in its own transaction.
  - **Orphan sweep** — finds dependent documents whose report no longer exists (or whose report passed the deadline) and removes them: Audio documents + physical files, Transcription documents, ChatConversation documents. This covers the case where the TTL safety net fired before the sweeper.
- The TTL indexes on `archivedAt` (24.4 Report, 24.8 Branch) remain as the MongoDB-internal safety net: if the app is down when the deadline passes, MongoDB deletes the parent document automatically after 30 days. TTL deletion runs server-side, cannot cascade dependents, and cannot use a Mongoose session — it is the single documented exception to 35.5, and the orphan sweep exists precisely to clean up after it.
- When both mechanisms race, the sweeper wins: it deletes the parent inside a transaction first, so the TTL index never fires for that document.

The flows below apply to every surface that lists or shows an archivable resource: Reports list cards (12.6), Reports MuiDataGrid action column, and the Report Details page header (12.6).

- **Active resource** — shows Archive only (ArchiveIcon, warning, tooltip "Archive"):
  - Click → MuiConfirmDialog (title "Archive Report" / "Archive Branch", message "Are you sure you want to archive this report?" / "Are you sure you want to archive this branch?", confirmText "Archive") → confirm → dispatch `PATCH /:<resourceNameId>/archive` → toast "Report archived" / "Branch archived" → the item moves to the archived state in the UI.
- **Archived resource** — shows Restore and Delete (Restore replaces Archive):
  - **Restore** — RestoreIcon (success), tooltip "Restore" → MuiConfirmDialog (title "Restore Report" / "Restore Branch", message "Restore this report to active use?" / "Restore this branch to active use?", confirmText "Restore") → confirm → dispatch `PATCH /:<resourceNameId>/restore` → toast "Report restored" / "Branch restored" → the item returns to the active state in the UI.
  - **Delete** — DeleteIcon (error), tooltip "Delete" → MuiConfirmDialog (title "Delete Report" / "Delete Branch", message "This permanently deletes the report, its transcription, audio files, and chat history. This cannot be undone." / "This permanently deletes this branch. This cannot be undone.", confirmText "Delete", confirmColor "error") → confirm → dispatch `DELETE /:<resourceNameId>` → toast "Report deleted" / "Branch deleted".
- On the Report Details page, after a successful delete the page navigates to `/reports` (existing behavior (12.6)); after a successful restore the header refreshes to the active state (Edit Report, Copy, Print, Archive reappear).
- On failure, the API message is toasted and the UI stays unchanged: 409 → the lifecycle message; 404 → "Report not found" / "Branch not found".
- Archived resources appear in lists only when the user explicitly filters for archived ones, and are shown with an "Archived" indicator.

- **Restore after deadline but before the sweeper ran** — the resource still exists but restore returns 409 with the 30-day window message (35.4). The resource is deleted on the next sweeper run.
- **Double delete or delete/restore race with the sweeper** — the second request returns 404; the UI toasts "Report not found" / "Branch not found" and refreshes (existing 404 handling (12.6)).
- **Sweeper crash mid-transaction** — the transaction aborts, nothing is partially deleted, and the next run retries.
- **TTL fires before the sweeper** — the parent document is gone; the orphan sweep removes its dependents on the next run; any open UI shows the existing 404 behavior.
- **Physical file deletion fails after commit** — database state is already consistent; the failure is logged and the orphan sweep retries the file removal.
- **Archived branch** — reports keep their embedded branch snapshot and stay fully readable; the branch picker and selection lists simply stop offering the archived branch (35.1).

- ADR-015 (Two-Path Deletion Lifecycle) and ADR-018 (Session-Based Transactions) remain authoritative and are implemented by this section.
- The glossary term "Two-Path Deletion" is unchanged.
- The existing statements that `archivedAt` "is used by TTL index for automatic deletion after 30 days" (24.4 field notes) remain true — the TTL index is the safety net, the sweeper is the primary in-app mechanism (35.6).
