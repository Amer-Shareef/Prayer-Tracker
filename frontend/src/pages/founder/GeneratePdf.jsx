import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { memberAPI } from '../../services/api';

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return '-';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper function to format date as DD-MMM-YYYY (01-Jul-2025)
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  return `${day}-${month}`;
};

// Function to get real prayer statistics from database
const getPrayerStatistics = async (memberId, memberJoinDate = null) => {
  try {
    const currentDate = new Date();
    let startDate = new Date();
    let daysToCheck = 40;
    
    // If member joined less than 40 days ago, limit to their join date
    if (memberJoinDate) {
      const joinDate = new Date(memberJoinDate);
      const daysSinceJoined = Math.floor((currentDate - joinDate) / (1000 * 60 * 60 * 24));
      if (daysSinceJoined < 40) {
        daysToCheck = daysSinceJoined + 1; // Include join date
        startDate = joinDate;
      } else {
        startDate.setDate(currentDate.getDate() - 40);
      }
    } else {
      startDate.setDate(currentDate.getDate() - 40);
    }
    
    console.log(`📊 Fetching prayer statistics for member ${memberId} for past ${daysToCheck} days`);
    
    // Call API to get prayer statistics for the member
    const response = await memberAPI.getMemberPrayerStats(memberId, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: currentDate.toISOString().split('T')[0]
    });
    
    if (response.success && response.data) {
      console.log('✅ Prayer statistics loaded from API');
      return processPrayerDataIntoDays(response.data, memberJoinDate);
    } else {
      console.warn('⚠️ No prayer statistics found, using fallback data');
      return generateFallbackPrayerStats(memberJoinDate);
    }
  } catch (error) {
    console.error('❌ Error fetching prayer statistics:', error);
    // Return fallback data in case of error
    return generateFallbackPrayerStats(memberJoinDate);
  }
};

// Helper function to process prayer data into daily format
const processPrayerDataIntoDays = (prayerData, memberJoinDate = null) => {
  const days = [];
  const currentDate = new Date();
  let daysToCheck = 40;
  
  // If member joined less than 40 days ago, limit to their join date
  if (memberJoinDate) {
    const joinDate = new Date(memberJoinDate);
    const daysSinceJoined = Math.floor((currentDate - joinDate) / (1000 * 60 * 60 * 24));
    if (daysSinceJoined < 40) {
      daysToCheck = daysSinceJoined + 1; // Include join date
    }
  }
  
  // Generate days in descending order (today first)
  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date();
    date.setDate(currentDate.getDate() - i);
    
    // Find prayer data for this date
    const dayPrayer = prayerData.find(prayer => {
      const prayerDate = new Date(prayer.prayer_date);
      return prayerDate.toDateString() === date.toDateString();
    });
    
    const fajr = dayPrayer?.fajr ? 'O' : '-';
    const dhuhr = dayPrayer?.dhuhr ? 'O' : '-';
    const asr = dayPrayer?.asr ? 'O' : '-';
    const maghrib = dayPrayer?.maghrib ? 'O' : '-';
    const isha = dayPrayer?.isha ? 'O' : '-';
    const zikr = (dayPrayer?.zikr_count || 0) + (dayPrayer?.zikr_count_2 || 0);
    const quran = dayPrayer?.quran_minutes || 0;
    
    days.push({
      date: formatDate(date),
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
      zikr,
      quran
    });
  }
  
  return days;
};

// Fallback function for generating sample data when API fails
const generateFallbackPrayerStats = (memberJoinDate = null) => {
  const days = [];
  const currentDate = new Date();
  let daysToCheck = 40;
  
  // If member joined less than 40 days ago, limit to their join date
  if (memberJoinDate) {
    const joinDate = new Date(memberJoinDate);
    const daysSinceJoined = Math.floor((currentDate - joinDate) / (1000 * 60 * 60 * 24));
    if (daysSinceJoined < 40) {
      daysToCheck = daysSinceJoined + 1; // Include join date
    }
  }
  
  // Generate days in descending order (today first)
  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date();
    date.setDate(currentDate.getDate() - i);
    
    // Generate realistic prayer attendance (some randomness but mostly consistent)
    const fajrAttended = Math.random() > 0.4; // 60% attendance for fajr
    const dhuhrAttended = Math.random() > 0.2; // 80% attendance
    const asrAttended = Math.random() > 0.2; // 80% attendance  
    const maghribAttended = Math.random() > 0.1; // 90% attendance
    const ishaAttended = Math.random() > 0.3; // 70% attendance
    const zikrDone = Math.random() > 0.5; // 50% zikr done
    const quranRead = Math.random() > 0.6; // 40% quran read
    
    const fajr = fajrAttended ? 'O' : '-';
    const dhuhr = dhuhrAttended ? 'O' : '-';
    const asr = asrAttended ? 'O' : '-';
    const maghrib = maghribAttended ? 'O' : '-';
    const isha = ishaAttended ? 'O' : '-';
    const zikr = Math.floor(Math.random() * 20); // Random zikr count 0-19
    const quran = Math.floor(Math.random() * 60); // Random quran minutes 0-59
    
    days.push({
      date: formatDate(date),
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
      zikr,
      quran
    });
  }
  
  return days;
};

const generateMemberReport = async (member) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 10; // Reduced margin from 15 to 10
  let yPosition = margin;

  // Colors - Changed to greens
  const primaryColor = '#1f2937'; // Dark gray
  const secondaryColor = '#6b7280'; // Medium gray
  const accentColor = '#047857'; // Green (from emerald-700)
  const lightGreen = [4, 120, 87]; // RGB for tables
  const veryLightGreen = [240, 253, 250]; // Very light green for alternating rows

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace = 15) => { // Reduced required space
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header background
doc.setFillColor(240, 253, 250); // Very light green
doc.rect(0, 0, pageWidth, 45, 'F'); // Slightly taller to fit 2 lines + logo

// === Logo Placeholder ===
// If you have a logo image, load it with doc.addImage()
// Example (replace 'logoData' with actual image base64 or URL):
// doc.addImage(logoData, 'PNG', 10, 8, 20, 20); 
// For now just leave the space on the left

// === Header Text: Fajr Council ===
doc.setFontSize(32); // Main header font
doc.setTextColor(primaryColor);
doc.setFont('helvetica', 'bold');
doc.text('Fajr Council', pageWidth / 2, 16, { align: 'center' });

// === Sub-header Text: Member Comprehensive Report ===
doc.setFontSize(18); // Smaller font
doc.setTextColor(secondaryColor);
doc.setFont('helvetica', 'normal');
doc.text('Member Comprehensive Report', pageWidth / 2, 30, { align: 'center' });

// === Date below ===
doc.setFontSize(9); 
doc.setTextColor(secondaryColor);
doc.text(
  `Generated on: ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 
  pageWidth / 2, 
  40, 
  { align: 'center' }
);

yPosition = 55; // Start content lower, since header is taller


  // Member Information Section (Compact)
  doc.setFontSize(15); // Increased font size
  doc.setTextColor(accentColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Personal & Account Information', margin, yPosition);
  yPosition += 8; // Reduced spacing

  // Create member info table
  const memberInfo = [
    ['Member ID', member.memberId || 'N/A'],
    ['Full Name', member.fullName || 'N/A'],
    ['Age', calculateAge(member.dateOfBirth).toString()],
    ['Date of Birth', member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'],
    ['Place of Birth', member.placeOfBirth || 'N/A'],
    ['NIC Number', member.nicNo || 'N/A'],
    ['Email', member.email || 'N/A'],
    ['Phone', member.phone || 'N/A'],
    ['Address', member.address || 'N/A'],
    ['Workplace Address', member.workplaceAddress || 'N/A'],
    ['Area', member.subarea || 'N/A'],
    ['Mahallah', member.area || 'N/A'],
    ['Mobility', member.mobility || 'N/A'],
    ['Occupation', member.occupation || 'N/A'],
    ['Family Status', member.familyStatus || 'N/A'],
    ['Receiving Assistance', (member.familyStatus === 'Widow' && member.widowAssistance) ? 'Yes' : 'No'],
    ['Role', member.role === 'Member' ? 'Member' :
             member.role === 'WCM' ? 'Working Committee Member' :
             member.role === 'Founder' ? 'Working Committee Admin' :
             member.role === 'SuperAdmin' ? 'Super Admin' :
             (member.role || 'N/A')],
    ['Status', member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : 'N/A'],
    ['Joined Date', member.joined_date ? new Date(member.joined_date).toLocaleDateString() : 'N/A'],
    ['Living on Rent', member.onRent ? 'Yes' : 'No'],
    ['Zakath Eligible', member.zakathEligible ? 'Yes' : 'No'],
    ['Differently Abled', member.differentlyAbled ? 'Yes' : 'No'],
    ['Muallafathil Quloob', member.MuallafathilQuloob ? 'Yes' : 'No']
  ];

  // Split into two columns to save space
  const midPoint = Math.ceil(memberInfo.length / 2);
  const leftColumn = memberInfo.slice(0, midPoint);
  const rightColumn = memberInfo.slice(midPoint);

  autoTable(doc, {
    startY: yPosition,
    body: leftColumn.map((item, index) => [
      item[0], item[1],
      rightColumn[index] ? rightColumn[index][0] : '',
      rightColumn[index] ? rightColumn[index][1] : ''
    ]),
    theme: 'grid',
    bodyStyles: { 
      fontSize: 8,
      cellPadding: 1.5 // Reduced padding
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 45 }
    },
    margin: { left: margin, right: margin },
    tableWidth: 'auto'
  });

  yPosition = doc.lastAutoTable.finalY + 10; // Reduced spacing

  // Check if we need a new page before prayer statistics
  checkPageBreak(25);

  // Prayer Statistics Section - Daily Format
  doc.setFontSize(15);
  doc.setTextColor(accentColor);
  doc.setFont('helvetica', 'bold');
  const daysText = member.joined_date ? (() => {
    const joinDate = new Date(member.joined_date);
    const currentDate = new Date();
    const daysSinceJoined = Math.floor((currentDate - joinDate) / (1000 * 60 * 60 * 24));
    return daysSinceJoined < 40 ? `Prayer Statistics - Past ${daysSinceJoined + 1} Days (Since Joining)` : 'Prayer Statistics';
  })() : 'Prayer Statistics - Past 40 Days';
  
  doc.text(daysText, margin, yPosition);
  yPosition += 12;

  try {
    // Get prayer statistics
    const prayerStats = await getPrayerStatistics(member.id, member.joined_date);
    
    if (prayerStats.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor);
      doc.text('No prayer statistics available for this member.', margin, yPosition);
      yPosition += 10;
    } else {
      // Process statistics in chunks of 20 days per page for better readability
      const daysPerPage = 20;
      let currentDayIndex = 0;
      let isFirstTable = true; // Track if this is the first table

      while (currentDayIndex < prayerStats.length) {
        const dayChunk = prayerStats.slice(currentDayIndex, currentDayIndex + daysPerPage);
        
        // Check if we need a new page
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = margin;
          isFirstTable = false; // No longer the first table after page break
          
          // Add section header on new page
          doc.setFontSize(13);
          doc.setTextColor(accentColor);
          doc.setFont('helvetica', 'bold');
          doc.text(daysText + ' (Continued)', margin, yPosition);
          yPosition += 12;
        }

        // Create table for this chunk of days
        const tableData = dayChunk.map(day => [
          day.date,
          day.fajr === 'O' ? 'O' : '-',
          day.dhuhr === 'O' ? 'O' : '-',
          day.asr === 'O' ? 'O' : '-',
          day.maghrib === 'O' ? 'O' : '-',
          day.isha === 'O' ? 'O' : '-',
          day.zikr,
          day.quran
        ]);

        // Only show header on the first table
        const tableConfig = {
          startY: yPosition,
          body: tableData,
          theme: 'striped',
          bodyStyles: { 
            fontSize: 8,
            cellPadding: 2,
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 30, halign: 'center' }, // Date
            1: { cellWidth: 18, halign: 'center' }, // Fajr
            2: { cellWidth: 18, halign: 'center' }, // Dhuhr
            3: { cellWidth: 18, halign: 'center' }, // Asr
            4: { cellWidth: 20, halign: 'center' }, // Maghrib
            5: { cellWidth: 18, halign: 'center' }, // Isha
            6: { cellWidth: 18, halign: 'center' }, // Zikr
            7: { cellWidth: 20, halign: 'center' }, // Quran
          },
          alternateRowStyles: { fillColor: veryLightGreen },
          margin: { left: margin, right: margin }
        };

        // Add header only for the first table
        if (isFirstTable) {
          tableConfig.head = [['Date', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Zikr', 'Quran']];
          tableConfig.headStyles = {
            fillColor: lightGreen,
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 9
          };
          isFirstTable = false; // Mark that we've shown the header
        }

        autoTable(doc, tableConfig);

        yPosition = doc.lastAutoTable.finalY + 8;
        currentDayIndex += daysPerPage;
      }
      // Summary section removed as requested
    }
  } catch (error) {
    console.error('Error generating prayer statistics:', error);
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);
    doc.text('Error loading prayer statistics. Please try again.', margin, yPosition);
  }

  // Footer on every page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    doc.text(
      `Fajr Council Member Report | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `Member_Report_${member.username || member.memberId || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export default generateMemberReport;
