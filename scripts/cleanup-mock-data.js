#!/usr/bin/env node

/**
 * Mock Data Cleanup Script
 * Removes placeholder/mock data from EduDash Pro components
 * Replaces with proper database queries and AI integration
 */

const fs = require('fs');
const path = require('path');

const MOCK_DATA_PATTERNS = [
  // Common mock data patterns
  /mockStats.*=.*{[\s\S]*?}/g,
  /mockData.*=.*{[\s\S]*?}/g,
  /Mock.*data/gi,
  /placeholder.*data/gi,
  /test.*data/gi,
  /fake.*data/gi,
  /dummy.*data/gi,
  // Specific mock patterns
  /totalSchools:\s*47/g,
  /totalUsers:\s*2840/g,
  /monthlyRevenue:\s*234500/g,
  /attendanceRate:\s*95/g,
  /{\s*id:\s*['"]1['"],[\s\S]*?}/g, // Simple mock objects with id: '1'
];

const FILES_TO_CLEAN = [
  'app/screens/superadmin-dashboard.tsx',
  'app/screens/principal-dashboard.tsx',
  'app/screens/teacher-dashboard-simple.tsx',
  'app/screens/parent-dashboard.tsx',
  'app/(teacher)/reports.tsx',
  'components/dashboard/EnhancedParentDashboard.tsx',
  'app/(tabs)/payment.tsx',
  'app/(tabs)/videocalls.tsx',
  'lib/services/assessmentsService.ts',
  'lib/services/reportsService.ts',
  'lib/services/homeworkService.ts',
  'lib/services/paymentService.ts',
];

function findMockData(content) {
  const mockDataFound = [];
  
  // Check for mock data patterns
  MOCK_DATA_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      mockDataFound.push({
        pattern: index,
        matches: matches.length,
        sample: matches[0].substring(0, 100) + '...'
      });
    }
  });

  // Check for hardcoded arrays of objects (common in mock data)
  const objectArrayMatches = content.match(/\[\s*{\s*id:\s*['"][^'"]*['"][^}]*}[^]]*\]/g);
  if (objectArrayMatches) {
    mockDataFound.push({
      pattern: 'object_arrays',
      matches: objectArrayMatches.length,
      sample: objectArrayMatches[0].substring(0, 100) + '...'
    });
  }

  // Check for setState with mock data
  const setStateMocks = content.match(/setState\(\s*{[\s\S]*?classes:\s*\[[^}]*{\s*id:/g);
  if (setStateMocks) {
    mockDataFound.push({
      pattern: 'setState_mocks',
      matches: setStateMocks.length,
      sample: setStateMocks[0].substring(0, 100) + '...'
    });
  }

  return mockDataFound;
}

function analyzeMockDataInFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {

    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const mockData = findMockData(content);
  
  return {
    filePath,
    fullPath,
    fileSize: content.length,
    linesOfCode: content.split('\n').length,
    mockDataFound: mockData,
    hasMockData: mockData.length > 0
  };
}

function generateCleanupReport() {

  const results = [];
  let totalMockDataFiles = 0;
  let totalMockDataInstances = 0;

  FILES_TO_CLEAN.forEach(filePath => {
    const analysis = analyzeMockDataInFile(filePath);
    if (analysis) {
      results.push(analysis);
      if (analysis.hasMockData) {
        totalMockDataFiles++;
        totalMockDataInstances += analysis.mockDataFound.reduce((sum, item) => sum + item.matches, 0);
      }
    }
  });

  // Summary

  // Detailed results

  results.forEach(result => {
    if (result.hasMockData) {

      result.mockDataFound.forEach(mock => {

      });

    } else {

    }
  });

  // Recommendations

  const highPriorityFiles = results.filter(r => r.hasMockData && r.mockDataFound.length > 2);
  if (highPriorityFiles.length > 0) {

    highPriorityFiles.forEach(file => {

    });

  }

  const mediumPriorityFiles = results.filter(r => r.hasMockData && r.mockDataFound.length <= 2);
  if (mediumPriorityFiles.length > 0) {

    mediumPriorityFiles.forEach(file => {

    });

  }

  // Suggested replacements

  return {
    totalFiles: results.length,
    filesWithMockData: totalMockDataFiles,
    totalMockInstances: totalMockDataInstances,
    results
  };
}

// Run the analysis
if (require.main === module) {
  const report = generateCleanupReport();

}

module.exports = {
  generateCleanupReport,
  analyzeMockDataInFile,
  FILES_TO_CLEAN
};
