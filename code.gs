/**
 * ==========================================================================================
 * PROJECT: GURUKULAM ENTERPRISE SENDER ENGINE (EXTENDED BUILD)
 * ==========================================================================================
 * Version: 12.0.0 (Titanium Architecture - Highly Detailed & Modular)
 * Author: Gurukulam IT Cell & AI Assistant
 * Description: High-precision attendance tracker, spam blocker, and result dispatcher.
 * Features: Modular phases, strict validation, advanced risk profiling, deep memory caching.
 * ==========================================================================================
 */

// ==========================================================================================
// ⚙️ SYSTEM CONFIGURATION & CONSTANTS
// ==========================================================================================
const SYSTEM_CONFIG = {
    SHEET_ID: '1lRSu21jAJ_XSijk9K-tyQbIGHGc4OsQ-bB0k4SsaEfs', 
    TIMEZONE: "Asia/Kolkata",
    DATE_FORMAT: "dd/MM/yyyy",
    CACHE_EXPIRY: 21600, // 6 Hours in seconds
    RISK_THRESHOLDS: {
        MEDIUM: 3,
        CRITICAL: 5,
        SEVERE: 10
    },
    DB_NAMES: {
        STUDENTS: 'DB_Students',
        ATTENDANCE: 'Log_Attendance',
        ALERTS: 'Log_Alerts'
    }
};

/**
 * --- HTTP ROUTING (App Entry Point) ---
 */
function doGet() {
    SystemHealer.verifyDatabase();
    return HtmlService.createHtmlOutputFromFile('Index')
        .setTitle('Gurukulam Alerts & Results | Enterprise')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


/**
 * ==========================================================================================
 * 🤖 1. SYSTEM HEALER (AUTO HEADER & DATABASE MANAGER)
 * ==========================================================================================
 */
class SystemHealer {
  static verifyDatabase() {
    try {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let alertSheet = ss.getSheetByName('Log_Alerts');
      
      // Ye headers automatically set honge
      const headers = ['System Timestamp', 'Student Name', 'Alert Type', 'Absence Block ID', 'Student ID', 'Risk Level', 'Status'];

      if (!alertSheet) {
        // Agar sheet hai hi nahi, toh nayi banayega
        alertSheet = ss.insertSheet('Log_Alerts');
        alertSheet.appendRow(headers);
        alertSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#2c3e50").setFontColor("#ffffff");
        alertSheet.setFrozenRows(1);
      } else {
        // Agar sheet hai par Header (Row 1) khali hai, toh khud likh dega
        let firstRow = alertSheet.getRange(1, 1, 1, headers.length).getValues()[0];
        if (!firstRow[0] || String(firstRow[0]).trim() === "") {
           alertSheet.getRange(1, 1, 1, headers.length).setValues([headers])
                     .setFontWeight("bold").setBackground("#2c3e50").setFontColor("#ffffff");
           alertSheet.setFrozenRows(1);
        }
      }
    } catch (e) {
      console.error("SystemHealer Error: " + e.message);
    }
  }
}


/**
 * ==========================================================================================
 * 🧠 2. ADVANCED ABSENTEE ENGINE (THE CORE LOGIC)
 * Divided into 6 distinct analytical phases for maximum accuracy.
 * ==========================================================================================
 */
function getDynamicAbsenteeList() {
    try {
        const ss = SpreadsheetApp.openById(SYSTEM_CONFIG.SHEET_ID); 
        const todayObj = new Date();
        const todayStr = Utilities.formatDate(todayObj, SYSTEM_CONFIG.TIMEZONE, SYSTEM_CONFIG.DATE_FORMAT);
        const dayName = Utilities.formatDate(todayObj, SYSTEM_CONFIG.TIMEZONE, "EEE");

        // ----------------------------------------------------------------------
        // 🛑 PHASE 0: STRICT TEMPORAL LOCKS (SUNDAY CHECK)
        // ----------------------------------------------------------------------
        if (dayName === "Sun") {
            throw new Error("HOLIDAY_BLOCK: <br><div style='padding:15px; margin-top:10px; background:rgba(46, 204, 113, 0.1); border:1px solid #2ecc71; border-radius:8px; line-height:1.5;'><span style='font-size:1.4rem; color:#2ecc71;'>🌴 <b>SUNDAY CHILL MODE</b> 🌴</span><br><span style='color:#bdc3c7; font-size:0.95rem;'>Today is a scheduled Week Off. The Alert Engine is in sleep mode to prevent disturbing parents.</span></div>");
        }

        // ----------------------------------------------------------------------
        // 🧑‍🎓 PHASE 1: MASTER DIRECTORY SYNCHRONIZATION (ID-BASED)
        // ----------------------------------------------------------------------
        const dbSheet = ss.getSheetByName(SYSTEM_CONFIG.DB_NAMES.STUDENTS);
        if(!dbSheet) throw new Error("CRITICAL FAILURE: Student Database Missing!");
        const dbData = dbSheet.getDataRange().getDisplayValues();
        
        let activeStudentsMap = {};
        let totalActiveCount = 0;

        // Start from index 1 to skip headers
        for (let i = 1; i < dbData.length; i++) {
            let accountStatus = String(dbData[i][9]).trim().toUpperCase(); 
            
            // Strict Validation: Only process verified 'ACTIVE' accounts
            if (accountStatus === 'ACTIVE' || accountStatus === '') {
                let id = String(dbData[i][1]).trim().toUpperCase();
                let name = String(dbData[i][2]).trim(); 
                let mobile = String(dbData[i][3]).trim(); 
                let uClass = String(dbData[i][6]).trim();
                
                // Ignore ghost rows or incomplete profiles
                if (id && name) {
                    activeStudentsMap[id] = { 
                        id: id,
                        name: name,
                        uClass: uClass || "Unassigned",
                        mobile: mobile || "No Number", 
                        isAbsentToday: true,      // Assume absent until proven present
                        pastAbsentDates: [],      // Array to hold historical absences
                        streakBroken: false       // Tracking flag
                    };
                    totalActiveCount++;
                }
            }
        }
        console.log(`[PHASE 1] Master Directory Synced. Total Active Students: ${totalActiveCount}`);

        // ----------------------------------------------------------------------
        // 📊 PHASE 2: REAL-TIME ATTENDANCE STATE EVALUATION
        // ----------------------------------------------------------------------
        const logSheet = ss.getSheetByName(SYSTEM_CONFIG.DB_NAMES.ATTENDANCE); 
        if(!logSheet) throw new Error("CRITICAL FAILURE: Attendance Log Missing!");
        const logData = logSheet.getDataRange().getDisplayValues();

        let isSystemHoliday = false;
        let verifiedPresentCount = 0;

        // Iterate top-to-bottom to allow later entries to override earlier ones
        for (let i = 1; i < logData.length; i++) {
            let rowDate = String(logData[i][1]).trim();
            
            if (rowDate === todayStr) {
                let id = String(logData[i][5]).trim().toUpperCase();
                let role = String(logData[i][7]).trim().toLowerCase();
                let status = String(logData[i][8]).trim().toUpperCase();
                
                // Detect global holiday declarations
                if (status.includes("HOLIDAY") || status.includes("WEEK OFF") || status.includes("DECLARED")) {
                    isSystemHoliday = true;
                }
                
                // Track Student Status for TODAY
                if (role === 'student' && activeStudentsMap[id]) {
                    if (status.includes("PRESENT") || status.includes("LATE") || status.includes("LEAVE")) {
                        // Mark as NOT absent (Safe zone)
                        activeStudentsMap[id].isAbsentToday = false; 
                    } else if (status.includes("ABSENT")) {
                        // Mark as explicitly absent
                        activeStudentsMap[id].isAbsentToday = true; 
                    }
                }
            }
        }

        // Count how many are actually present today
        for(let id in activeStudentsMap) {
            if (!activeStudentsMap[id].isAbsentToday) {
                verifiedPresentCount++;
            }
        }

        // 🌟 SMART SECURITY: Overrule fake holidays if students are actually present
        if (verifiedPresentCount > 0) {
            isSystemHoliday = false;
            console.log(`[PHASE 2] Holiday Overruled. Detected ${verifiedPresentCount} active check-ins today.`);
        } else if (isSystemHoliday) {
            // If truly a holiday and NO ONE is present, trigger the visual block
            throw new Error(`HOLIDAY_BLOCK: <br><div style='padding:15px; margin-top:10px; background:rgba(241, 196, 15, 0.1); border:1px solid #f1c40f; border-radius:8px; line-height:1.5;'><span style='font-size:1.4rem; color:#f1c40f;'>🎉 <b>SYSTEM HOLIDAY ACTIVE</b> 🎉</span><br><span style='color:#bdc3c7; font-size:0.95rem;'>An official holiday is registered in the database. Sender engine is locked to preserve quotas.</span></div>`);
        }

        // ----------------------------------------------------------------------
        // 🕰️ PHASE 3: HISTORICAL STREAK & BEHAVIOR ANALYSIS
        // ----------------------------------------------------------------------
        // Optimize search window to last 2000 rows to prevent execution timeouts
        let searchBoundary = Math.max(1, logData.length - 2000);
        
        for (let i = searchBoundary; i < logData.length; i++) {
            let rowDate = String(logData[i][1]).trim();
            let id = String(logData[i][5]).trim().toUpperCase();
            let role = String(logData[i][7]).trim().toLowerCase();
            let status = String(logData[i][8]).trim().toUpperCase();

            // Only analyze past dates for students who are absent TODAY
            if (rowDate !== todayStr && role === 'student' && activeStudentsMap[id] && activeStudentsMap[id].isAbsentToday) {
                
                // If they were absent in the past, add to their tracking array securely
                if (status.includes("ABSENT") && !activeStudentsMap[id].pastAbsentDates.includes(rowDate)) {
                    activeStudentsMap[id].pastAbsentDates.push(rowDate);
                }
            }
        }

        // ----------------------------------------------------------------------
        // 🛡️ PHASE 4: ANTI-SPAM & RATE LIMIT ENFORCEMENT
        // ----------------------------------------------------------------------
        const alertSheet = ss.getSheetByName(SYSTEM_CONFIG.DB_NAMES.ALERTS);
        const alertData = alertSheet ? alertSheet.getDataRange().getDisplayValues() : [];
        const alertsDispatchedToday = {};
        
        // Scan the logs to see who already received an SMS/WhatsApp today
        for(let i = 1; i < alertData.length; i++) {
            let blockDate = String(alertData[i][3]).trim(); // Absence Block ID (usually Date)
            let uId = String(alertData[i][4]).trim().toUpperCase(); // Student ID
            
            if (blockDate === todayStr && uId) {
                alertsDispatchedToday[uId] = true; 
            }
        }

        // ----------------------------------------------------------------------
        // 🚀 PHASE 5: RISK PROFILING & PAYLOAD COMPILATION
        // ----------------------------------------------------------------------
        let finalAbsenteePayload = [];
        
        for (let id in activeStudentsMap) {
            let student = activeStudentsMap[id];
            
            // Core condition: Must be absent today AND must NOT have been alerted today
            if (student.isAbsentToday && !alertsDispatchedToday[student.id]) {
                
                // Combine past absences with today's absence
                let chronologicalAbsences = [...student.pastAbsentDates, todayStr];
                let totalMissingDays = chronologicalAbsences.length;
                
                // UI Optimization: Only show the 4 most recent dates to prevent massive SMS bills
                let recentDatesFormatted = chronologicalAbsences.slice(-4).join(", ");
                if (totalMissingDays > 4) {
                    recentDatesFormatted += ` (+${totalMissingDays - 4} more)`;
                }
                
                // Dynamic Risk Assessment Logic
                let riskSeverity = "LOW";
                if (totalMissingDays >= SYSTEM_CONFIG.RISK_THRESHOLDS.SEVERE) {
                    riskSeverity = "SEVERE"; // Extremely High Risk
                } else if (totalMissingDays > SYSTEM_CONFIG.RISK_THRESHOLDS.CRITICAL) {
                    riskSeverity = "CRITICAL";
                } else if (totalMissingDays >= SYSTEM_CONFIG.RISK_THRESHOLDS.MEDIUM) {
                    riskSeverity = "MEDIUM";
                }

                // Push clean structured object to the frontend
                finalAbsenteePayload.push({ 
                    id: student.id,
                    name: student.name,
                    class: student.uClass, 
                    mobile: student.mobile, 
                    daysText: recentDatesFormatted, 
                    blockId: todayStr, 
                    riskLevel: riskSeverity,
                    count: totalMissingDays
                });
            }
        }
        
        // Final Sort: Prioritize students with the highest number of absences (Highest Risk First)
        finalAbsenteePayload.sort((a, b) => b.count - a.count);
        
        console.log(`[PHASE 5] Engine Execution Complete. Yielded ${finalAbsenteePayload.length} actionable alerts.`);
        return finalAbsenteePayload;

    } catch (error) {
        // Forward structured errors back to the frontend UI
        console.error("[FATAL CRASH] getDynamicAbsenteeList: " + error.message);
        throw new Error(error.message); 
    }
}

/**
 * ==========================================================================================
 * 📝 3. SECURE AUDIT LOGGER (UPDATED FOR DYNAMIC WA/SMS TRACKING)
 * Records every successful dispatch to prevent duplicate messaging.
 * ==========================================================================================
 */
function markAlertSent(id, name, blockId, riskLevel = "Normal", alertType = "System") {
    try {
        const ss = SpreadsheetApp.openById(SYSTEM_CONFIG.SHEET_ID);
        let alertSheet = ss.getSheetByName(SYSTEM_CONFIG.DB_NAMES.ALERTS);
        
        if(alertSheet) {
            // 🎯 THE FIX: Dynamically set the alert type based on the button clicked
            let exactType = (alertType === 'WA') ? 'WhatsApp Alert' : (alertType === 'SMS' ? 'SMS Alert' : 'System Alert');

            alertSheet.appendRow([
                new Date(),                             // Timestamp
                name,                                   // Name
                exactType,                              // Action Type (WhatsApp or SMS)
                blockId,                                // Date/Block ID
                id,                                     // Student ID
                riskLevel,                              // Risk Assessment
                'DISPATCHED_SUCCESS',                   // Final Status
                'System API'                            // Executor
            ]);
        }
        return true;
    } catch(e) { 
        console.error("Audit Logger failed to write: " + e.message);
        return false; 
    }
}

/**
 * ==========================================================================================
 * ⚡ 4. CLOUD-NATIVE RESULT FETCHER (DRIVE API + MEMORY CACHE)
 * Scans Google Drive securely, auto-updates permissions, and utilizes script caching.
 * ==========================================================================================
 */
function fetchResultFromDrive(rollNo, studentName) {
    try {
        const cache = CacheService.getScriptCache();
        
        // Deep sanitization of inputs to prevent query injection
        let safeRoll = String(rollNo).trim().replace(/['"\\%]/g, "");
        let safeName = String(studentName).trim().replace(/['"\\%]/g, "");
        
        // Construct unique cache key
        const cacheKey = `DOC_${safeRoll}_${safeName}`;

        // ----------------------------------------------------------------------
        // STEP A: Fetch Parent Contact Data from Database
        // ----------------------------------------------------------------------
        let securedMobile = "";
        const ss = SpreadsheetApp.openById(SYSTEM_CONFIG.SHEET_ID);
        const dbSheet = ss.getSheetByName(SYSTEM_CONFIG.DB_NAMES.STUDENTS);
        
        if (dbSheet) {
            const dbData = dbSheet.getDataRange().getDisplayValues();
            for (let i = 1; i < dbData.length; i++) {
                let dbRoll = String(dbData[i][1]).trim();
                let dbName = String(dbData[i][2]).trim();
                
                // Fuzzy matching logic
                if ((safeRoll && dbRoll === safeRoll) || (safeName && dbName.toLowerCase() === safeName.toLowerCase())) {
                    let rawMobile = String(dbData[i][3]).replace(/\D/g, ''); 
                    if (rawMobile.length >= 10) {
                        securedMobile = rawMobile.slice(-10); // Standardize to 10 digits
                        break; 
                    }
                }
            }
        }

        // ----------------------------------------------------------------------
        // STEP B: Consult High-Speed Cache
        // ----------------------------------------------------------------------
        const cachedUrl = cache.get(cacheKey);
        const cachedName = cache.get(cacheKey + "_name");
        
        if (cachedUrl && cachedName) {
            console.log(`[CACHE HIT] Returning stored payload for ${safeRoll || safeName}`);
            return { 
                status: 'SUCCESS', 
                url: cachedUrl, 
                fileName: cachedName, 
                cached: true, 
                mobile: securedMobile 
            };
        }

        // ----------------------------------------------------------------------
        // STEP C: Execute Google Drive Search Query
        // ----------------------------------------------------------------------
        console.log(`[CACHE MISS] Querying Drive API for ${safeRoll || safeName}`);
        let driveQuery = `mimeType='application/pdf' and trashed=false and (title contains '${safeRoll}'`;
        if(safeName.length > 2) {
            driveQuery += ` or title contains '${safeName}'`;
        }
        driveQuery += `)`;

        let files = DriveApp.searchFiles(driveQuery);

        if (files.hasNext()) {
            let file = files.next();
            
            // Auto-Elevate Permissions: Allow parents to view without login
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            
            let finalUrl = file.getUrl();
            let finalName = file.getName();
            
            // Hydrate the Cache for future requests
            cache.put(cacheKey, finalUrl, SYSTEM_CONFIG.CACHE_EXPIRY);
            cache.put(cacheKey + "_name", finalName, SYSTEM_CONFIG.CACHE_EXPIRY);

            return { 
                status: 'SUCCESS', 
                url: finalUrl, 
                fileName: finalName, 
                cached: false, 
                mobile: securedMobile 
            };
        } else {
            return { 
                status: 'ERROR', 
                message: 'Document missing in Drive vault. Ensure the PDF filename contains the exact Roll No or Name.' 
            };
        }
    } catch (e) {
        return { status: 'ERROR', message: "Drive Fetch Exception: " + e.message };
    }
}
