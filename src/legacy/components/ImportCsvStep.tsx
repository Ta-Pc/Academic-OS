import React, { useState, useCallback, ChangeEvent, DragEvent, useMemo } from 'react';
import { Assessment, AssessmentType, AssessmentStatus, AcademicTerm, Module, ModuleType } from '../types';
import { parse, isValid, format } from 'date-fns';
import { Icon } from './ui/Icon';

interface Props {
  onNext: () => void;
  onSkip: () => void;
  setImportedAssessments: (data: Assessment[]) => void;
  updateModules: (modules: Module[]) => void;
  calendarPeriods: AcademicTerm[];
}

type Phase = 'upload' | 'map' | 'preview' | 'conflict' | 'configuring' | 'confirm' | 'complete';

const SYSTEM_FIELDS: { key: keyof Assessment; name: string; required: boolean; description?: string }[] = [
  { key: 'moduleCode', name: 'Module Code', required: true },
  { key: 'assessmentName', name: 'Assessment Name', required: true },
  { key: 'assessmentType', name: 'Assessment Type', required: true },
  { key: 'weight', name: 'Weight (%)', required: true },
  { key: 'dueDate', name: 'Due Date', required: false },
  { key: 'result', name: 'Result (%)', required: false },
  // Status is intentionally omitted as it is auto-determined
];

const AUTO_EXCLUDED_FIELDS = ['uid', 'status', 'days until due', 'priority score', 'week num'];
const VALID_ASSESSMENT_TYPES: AssessmentType[] = ['Quiz', 'Semester Test', 'Assignment', 'Homework', 'Practical', 'Exam', 'Tutorial', 'Class Test'];

const SUPPORTED_DATE_FORMATS = [
  'yyyy-MM-dd', 'yyyy/MM/dd',
  'MM/dd/yyyy', 'MM-dd-yyyy',
  'dd/MM/yyyy', 'dd-MM-yyyy',
  'MMMM d, yyyy', 'd MMMM yyyy',
  'EEEE, MMMM d, yyyy',
  'EEEE, d MMMM yyyy',
  'd MMM yyyy',
  'MMM d, yyyy',
];

function parseDateString(dateString: string): Date | null {
  if (!dateString) return null;
  const cleanedString = dateString.trim().replace(/(\d+)(st|nd|rd|th)/, '$1');
  const referenceDate = new Date(); // needed for `parse`
  
  for (const fmt of SUPPORTED_DATE_FORMATS) {
    const parsedDate = parse(cleanedString, fmt, referenceDate);
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }
  
  // Try native parser as a last resort, it's good with ISO 8601 and some other formats
  const nativeParsed = new Date(cleanedString);
  if (isValid(nativeParsed)) {
      return nativeParsed;
  }

  return null;
}

interface ProcessedRow {
  rowIndex: number;
  originalData: Record<string, string>;
  processedData: Partial<Assessment>;
  transformations: Record<string, { from: string; to: string | number }>;
  errors: string[];
  warnings: string[];
}

interface Conflict {
  key: string;
  rows: ProcessedRow[];
}

const ImportCsvStep: React.FC<Props> = ({ onNext, onSkip, setImportedAssessments, updateModules, calendarPeriods }) => {
  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRawData, setCsvRawData] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [excludedColumns, setExcludedColumns] = useState<{ name: string; reason: string }[]>([]);

  const [processedData, setProcessedData] = useState<ProcessedRow[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, 'skip' | number>>({});
  
  // State for new module configuration
  const [newModuleCodes, setNewModuleCodes] = useState<string[]>([]);
  const [configuringModuleIndex, setConfiguringModuleIndex] = useState(0);
  const [configuredModules, setConfiguredModules] = useState<Module[]>([]);

  const normalizeHeader = (header: string): string => {
    return header.toLowerCase()
      .replace(/\(.*\)/, '') // Remove content in parentheses
      .replace(/[^a-z0-9]/g, '')
      .replace('assesment', 'assessment');
  };
  
  const handleFile = useCallback((selectedFile: File) => {
    setError('');
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file format. Please select a .csv file.');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setError("File is empty or could not be read.");
        return;
      }

      const lines = text.trim().split('\n');
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
      
      if (lines.length <= 1) {
          setError("CSV file contains no data rows.");
          return;
      }
      
      setCsvHeaders(headers);

      const data = lines.slice(1).map(line => {
        const values = line.split(delimiter);
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index]?.trim().replace(/"/g, '') || '';
          return obj;
        }, {} as Record<string, string>);
      });
      setCsvRawData(data);
      console.log('[CSV Import] File read successfully. Headers:', headers, 'Data rows:', data.length);
      console.log('[CSV Import] Parsed CSV data:', data);
      setPhase('map');
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsText(selectedFile);
  }, []);

  const handleAutoMap = useCallback(() => {
    const newMappings: Record<string, string> = {};
    const newExcluded: { name: string; reason: string }[] = [];
    const availableHeaders = [...csvHeaders];
    
    availableHeaders.forEach(header => {
        const normalized = normalizeHeader(header);
        if (AUTO_EXCLUDED_FIELDS.includes(normalized)) {
            newExcluded.push({ name: header, reason: `System-calculated field` });
        }
        const isEmpty = csvRawData.every(row => !row[header]);
        if (isEmpty) {
            newExcluded.push({ name: header, reason: 'Empty column' });
        }
    });

    const mappableHeaders = availableHeaders.filter(h => !newExcluded.some(ex => ex.name === h));
    
    SYSTEM_FIELDS.forEach(field => {
      const normalizedFieldName = normalizeHeader(field.name);
      const matchedHeader = mappableHeaders.find(header => normalizeHeader(header) === normalizedFieldName);
      if (matchedHeader) {
        newMappings[field.name] = matchedHeader;
      }
    });
    setMappings(newMappings);
    setExcludedColumns(newExcluded);
    console.log('[CSV Import] Auto-mapping results:', { mappings: newMappings, excluded: newExcluded });
  }, [csvHeaders, csvRawData]);

  const processAndValidateAllData = useCallback(() => {
    const data: ProcessedRow[] = [];
    
    const csvStatusHeader = mappings['Status'] || csvHeaders.find(h => normalizeHeader(h) === 'status');

    csvRawData.forEach((row, index) => {
      const result: ProcessedRow = {
        rowIndex: index,
        originalData: row,
        processedData: {},
        transformations: {},
        errors: [],
        warnings: [],
      };
      
      const moduleCode = row[mappings['Module Code']];
      if (moduleCode) result.processedData.moduleCode = moduleCode.toUpperCase();
      else result.errors.push("Module Code is missing.");
      
      const assessmentName = row[mappings['Assessment Name']];
      if (assessmentName) result.processedData.assessmentName = assessmentName;
      else result.errors.push("Assessment Name is missing.");
      
      const assessmentType = row[mappings['Assessment Type']] as AssessmentType;
      if (assessmentType) {
          const valid_type = VALID_ASSESSMENT_TYPES.find(t => t.toLowerCase() === assessmentType.toLowerCase());
          if (valid_type) {
              result.processedData.assessmentType = valid_type;
          } else {
              result.errors.push(`Invalid Assessment Type: "${assessmentType}".`);
          }
      } else result.errors.push("Assessment Type is missing.");

      const weightStr = row[mappings['Weight (%)']];
      if (weightStr) {
          const weightCleaned = weightStr.replace('%', '').replace(',', '.').trim();
          const weight = parseFloat(weightCleaned);
          if (!isNaN(weight) && weight >= 0.01 && weight <= 100) {
              result.processedData.weight = weight;
              if (weightStr !== weight.toString()) result.transformations['weight'] = { from: weightStr, to: weight };
          } else result.errors.push(`Invalid Weight: "${weightStr}". Must be between 0.01 and 100.`);
      } else result.errors.push("Weight is missing.");
      
      const dueDateStr = row[mappings['Due Date']];
      if (dueDateStr && dueDateStr.trim()) {
        if (dueDateStr.trim().toLowerCase() === 'tbc') {
            result.processedData.dueDate = 'TBC';
            result.transformations['dueDate'] = { from: dueDateStr, to: 'TBC (No Due Date)' };
        } else {
            const parsedDate = parseDateString(dueDateStr);
            if (parsedDate) {
                const isoDate = format(parsedDate, 'yyyy-MM-dd');
                result.processedData.dueDate = isoDate;
                if (dueDateStr !== isoDate) result.transformations['dueDate'] = { from: dueDateStr, to: isoDate };
            } else {
                result.processedData.dueDate = 'TBC';
                result.warnings.push(`Could not parse date: ${dueDateStr}`);
            }
        }
      } else {
          result.processedData.dueDate = 'TBC';
      }
      
      const resultStr = row[mappings['Result (%)']];
      if (resultStr && resultStr.trim()) {
        const resultCleaned = resultStr.replace('%', '').replace(',', '.').trim();
        const resultNum = parseFloat(resultCleaned);
        if (!isNaN(resultNum) && resultNum >= 0 && resultNum <= 100) {
            result.processedData.result = resultNum;
            if (resultStr !== resultNum.toString()) result.transformations['result'] = { from: resultStr, to: resultNum };
        } else result.warnings.push(`Invalid result "${resultStr}" ignored.`);
      }

      let status: AssessmentStatus;
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      if (result.processedData.result !== undefined && result.processedData.result !== null) {
          status = 'Graded';
      } 
      else if (result.processedData.dueDate && result.processedData.dueDate !== 'TBC') {
          const dueDate = new Date(result.processedData.dueDate);
          dueDate.setHours(0, 0, 0, 0); 

          if (dueDate < today) status = 'Missed';
          else status = 'Upcoming';
      }
      else {
          status = 'Upcoming';
      }
      result.processedData.status = status;
      
      const csvStatus = csvStatusHeader ? row[csvStatusHeader] : '';
      if (csvStatus && csvStatus !== status) {
        result.transformations['status'] = { from: csvStatus, to: status };
        result.warnings.push(`CSV Status "${csvStatus}" was ignored and recalculated as "${status}".`);
      }

      result.processedData.effort = 'Standard';

      if (result.errors.length === 0) {
        const { moduleCode, assessmentType, assessmentName } = result.processedData;
        result.processedData.id = `${moduleCode}-${assessmentType}-${assessmentName}`.toLowerCase();
      }
      data.push(result);
    });
    setProcessedData(data);
    console.log('[CSV Import] Data processing and validation results:', {
      totalRows: data.length,
      validRows: data.filter(r => r.errors.length === 0).length,
      errorRows: data.filter(r => r.errors.length > 0).length,
      warningRows: data.filter(r => r.warnings.length > 0).length,
      processedData: data
    });
    return data;
  }, [csvRawData, mappings, csvHeaders]);

  const detectConflicts = useCallback((validRows: ProcessedRow[]) => {
    const conflictsMap: Record<string, ProcessedRow[]> = {};
    validRows.forEach(row => {
      const key = row.processedData.id!;
      if (!conflictsMap[key]) conflictsMap[key] = [];
      conflictsMap[key].push(row);
    });

    const foundConflicts = Object.entries(conflictsMap)
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => ({ key, rows }));
    
    setConflicts(foundConflicts);

    const initialResolutions: Record<string, 'skip' | number> = {};
    foundConflicts.forEach(conflict => {
      initialResolutions[conflict.key] = conflict.rows[conflict.rows.length-1].rowIndex;
    });
    setConflictResolutions(initialResolutions);
    console.log('[CSV Import] Conflict detection results:', {
      totalConflicts: foundConflicts.length,
      conflicts: foundConflicts,
      initialResolutions
    });
    return foundConflicts.length > 0;
  }, []);

  const handleNextPhase = () => {
    if (phase === 'map') {
      processAndValidateAllData();
      setPhase('preview');
    } else if (phase === 'preview') {
      const validRows = processedData.filter(row => row.errors.length === 0);
      const hasConflicts = detectConflicts(validRows);
      if (hasConflicts) setPhase('conflict');
      else setPhase('confirm');
    } else if (phase === 'conflict') {
      setPhase('confirm');
    } else if (phase === 'confirm') {
      console.log('[CSV Import] Final import list and saving:', {
        finalImportList: finalImportList.map(row => row.processedData),
        modulesToConfigure: [...new Set(finalImportList.map(item => item.processedData.moduleCode!))]
      });
      const modulesToConfigure = [...new Set(finalImportList.map(item => item.processedData.moduleCode!))];
      if (modulesToConfigure.length > 0) {
        setNewModuleCodes(modulesToConfigure);
        setPhase('configuring');
      } else {
        setImportedAssessments(finalImportList.map(row => row.processedData as Assessment));
        updateModules([]);
        setPhase('complete');
        setTimeout(() => onNext(), 2000);
      }
    }
  };

  const handleCompleteModuleConfig = () => {
      const finalAssessments = finalImportList.map(row => row.processedData as Assessment);
      setImportedAssessments(finalAssessments);
      updateModules(configuredModules);
      setPhase('complete');
      setTimeout(() => onNext(), 2000);
  }

  const handleBackPhase = () => {
    if (phase === 'map') setPhase('upload');
    if (phase === 'preview') setPhase('map');
    if (phase === 'conflict') setPhase('preview');
    if (phase === 'confirm') conflicts.length > 0 ? setPhase('conflict') : setPhase('preview');
    if (phase === 'configuring') setPhase('confirm');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleMappingChange = (fieldName: string, csvHeader: string) => {
    setMappings(prev => ({ ...prev, [fieldName]: csvHeader }));
  };
  const handleConflictResolution = (key: string, value: 'skip' | number) => {
    setConflictResolutions(prev => ({ ...prev, [key]: value }));
  };

  const allRequiredMapped = SYSTEM_FIELDS.filter(f => f.required).every(field => mappings[field.name]);

  const summary = useMemo(() => {
    if (phase < 'preview') return null;
    return {
      total: csvRawData.length,
      valid: processedData.filter(r => r.errors.length === 0).length,
      errors: processedData.filter(r => r.errors.length > 0).length,
      warnings: processedData.filter(r => r.warnings.length > 0).length,
    }
  }, [phase, processedData, csvRawData]);

  const finalImportList = useMemo(() => {
    const validRows = processedData.filter(row => row.errors.length === 0);
    const nonConflictRows = validRows.filter(row => !conflicts.some(c => c.key === row.processedData.id));
    const resolvedConflictRows = conflicts.map(c => {
        const resolution = conflictResolutions[c.key];
        if (resolution === 'skip') return null;
        return c.rows.find(r => r.rowIndex === resolution);
    }).filter(Boolean) as ProcessedRow[];
    return [...nonConflictRows, ...resolvedConflictRows];
  }, [processedData, conflicts, conflictResolutions]);
  
  const renderContent = () => {
    switch (phase) {
      case 'upload': return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Import Academic Data</h2>
            <p className="text-slate-500 mt-2 mb-8">Import modules and assignments from a CSV file. This step is optional.</p>
            <div className="mx-auto max-w-lg" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
              <label htmlFor="csv-file" className="flex flex-col justify-center items-center w-full h-48 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-slate-300 dark:border-slate-600 border-dashed cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Icon name="UploadCloud" className="w-10 h-10 mb-3 text-slate-400" strokeWidth={2} />
                  <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <input id="csv-file" type="file" className="hidden" accept=".csv,text/csv" onChange={handleFileChange} />
              </label>
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
      );
      case 'map': return (
          <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Map Columns</h2>
                    <p className="text-slate-500 mt-1">Match your CSV columns to system fields. <span className="text-red-500">*</span> required.</p>
                </div>
                <button onClick={handleAutoMap} className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 text-sm">Auto Map</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {SYSTEM_FIELDS.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium"> {field.name} {field.required && <span className="text-red-500">*</span>} </label>
                  <select value={mappings[field.name] || ''} onChange={(e) => handleMappingChange(field.name, e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option value="" disabled>Select a column...</option>
                    {csvHeaders.map((header, index) => <option key={`${field.name}-${index}`} value={header}>{header}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {excludedColumns.length > 0 && (
                <div className="mb-6 text-sm p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="font-medium">Auto-excluded columns:</p>
                    <ul className="list-disc pl-5 mt-1 text-slate-500 dark:text-slate-400">
                        {excludedColumns.map((ec, index) => <li key={`${ec.name}-${index}`}><b>{ec.name}</b> ({ec.reason})</li>)}
                    </ul>
                </div>
            )}
          </div>
      );
      case 'preview': return (
          <div>
              <h2 className="text-2xl font-bold">Preview & Validate Data</h2>
              <p className="text-slate-500 mt-1 mb-4">Review your data. Errors must be fixed by going back.</p>
              {summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                      <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg"><div className="text-2xl font-bold">{summary.total}</div><div className="text-sm">Total Rows</div></div>
                      <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg"><div className="text-2xl font-bold">{summary.valid}</div><div className="text-sm">Valid</div></div>
                      <div className="p-3 bg-red-100 dark:bg-red-800 rounded-lg"><div className="text-2xl font-bold">{summary.errors}</div><div className="text-sm">Errors</div></div>
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-lg"><div className="text-2xl font-bold">{summary.warnings}</div><div className="text-sm">Warnings</div></div>
                  </div>
              )}
              {summary && summary.errors > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/40 border-l-4 border-red-500 text-red-800 dark:text-red-200 p-4 rounded-r-lg mb-6" role="alert">
                      <p className="font-bold">Errors Detected!</p>
                      <p>Your file contains {summary.errors} row{summary.errors > 1 ? 's' : ''} with critical errors (highlighted in red below). Please click the <strong>"Back"</strong> button to fix your column mappings or upload a corrected file.</p>
                  </div>
              )}
              <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0"><tr>
                          {SYSTEM_FIELDS.slice(0,5).map(f => <th key={f.key} className="p-2 font-medium text-left">{f.name}</th>)}
                          <th className="p-2 font-medium text-left">Status</th>
                      </tr></thead>
                      <tbody className="bg-white dark:bg-slate-800">
                          {processedData.map(row => (
                              <tr key={`${row.rowIndex}-${row.processedData.id || 'no-id'}`} className={`border-b dark:border-slate-700 ${row.errors.length > 0 ? 'bg-red-50 dark:bg-red-900/50' : row.warnings.length > 0 ? 'bg-yellow-50 dark:bg-yellow-900/50' : ''}`}>
                                  {SYSTEM_FIELDS.slice(0, 5).map(f => {
                                    const transformation = row.transformations[f.key];
                                    const displayValue = String(row.processedData[f.key as keyof Assessment] ?? '');
                                    
                                    let cellTitle = '';
                                    
                                    if (f.key === 'dueDate') {
                                      const dateWarning = row.warnings.find(w => w.startsWith('Could not parse date:'));
                                      if (dateWarning) {
                                        const originalDateStr = row.originalData[mappings['Due Date']];
                                        cellTitle += `Could not parse date '${originalDateStr}'. Please use a supported format like YYYY-MM-DD.`;
                                      }
                                    }
                                    
                                    if (transformation) {
                                      const transformationText = `Original: '${transformation.from}', Transformed to: '${transformation.to}'`;
                                      cellTitle = cellTitle ? `${cellTitle}\n${transformationText}` : transformationText;
                                    }

                                    return (
                                      <td key={f.key} className="p-2 truncate" title={cellTitle || undefined}>
                                        {displayValue}
                                        {transformation && <span className="ml-1 text-blue-500" aria-label="Value was transformed">*</span>}
                                      </td>
                                    );
                                  })}
                                  <td className="p-2">
                                      {row.errors.length > 0 
                                        ? <span className="font-bold text-red-600">Error</span> 
                                        : row.warnings.length > 0
                                        ? <span className="font-bold text-yellow-700 dark:text-yellow-400">Warning</span>
                                        : 'Valid'
                                      }
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
       case 'conflict': return (
          <div>
              <h2 className="text-2xl font-bold">Resolve Conflicts</h2>
              <p className="text-slate-500 mt-1 mb-6">Found {conflicts.length} duplicate assessments. Please choose which version to keep.</p>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {conflicts.map(conflict => (
                  <div key={conflict.key} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold">{conflict.rows[0].processedData.moduleCode} - {conflict.rows[0].processedData.assessmentName}</h3>
                    <p className="text-sm text-slate-500 mb-3">Found in {conflict.rows.length} rows: ({conflict.rows.map(r => `Row ${r.rowIndex+2}`).join(', ')})</p>
                    <div className="space-y-2">
              {conflict.rows.map(row => (
                <label key={`${conflict.key}-${row.rowIndex}`} className="flex items-center p-2 border rounded-md cursor-pointer bg-white dark:bg-slate-800">
                  <input type="radio" name={conflict.key} value={row.rowIndex} checked={conflictResolutions[conflict.key] === row.rowIndex} onChange={() => handleConflictResolution(conflict.key, row.rowIndex)} className="mr-3" />
                  <span className="text-sm"><b>Row {row.rowIndex+2}:</b> Weight: {row.processedData.weight}%, Due: {row.processedData.dueDate}, Result: {row.processedData.result ?? 'N/A'}</span>
                </label>
              ))}
                       <label className="flex items-center p-2 border rounded-md cursor-pointer bg-white dark:bg-slate-800">
                          <input type="radio" name={conflict.key} value="skip" checked={conflictResolutions[conflict.key] === 'skip'} onChange={() => handleConflictResolution(conflict.key, 'skip')} className="mr-3" />
                          <span className="text-sm text-red-600 font-medium">Skip this assessment</span>
                        </label>
                    </div>
                  </div>
                ))}
              </div>
          </div>
      );
      case 'configuring': return (
          <ModuleConfigurator 
            moduleCode={newModuleCodes[configuringModuleIndex]}
            currentIndex={configuringModuleIndex}
            total={newModuleCodes.length}
            academicTerms={calendarPeriods}
            onSave={(moduleData) => {
                const newConfiguredModules = [...configuredModules, moduleData];
                setConfiguredModules(newConfiguredModules);
                if (configuringModuleIndex < newModuleCodes.length - 1) {
                    setConfiguringModuleIndex(prev => prev + 1);
                } else {
                    // This was the last one, complete the process
                    const finalAssessments = finalImportList.map(row => row.processedData as Assessment);
                    setImportedAssessments(finalAssessments);
                    updateModules(newConfiguredModules);
                    setPhase('complete');
                    setTimeout(() => onNext(), 3000);
                }
            }}
            onCancel={() => {
                // Rollback and skip to next step
                setImportedAssessments([]);
                updateModules([]);
                onNext();
            }}
          />
      );
      case 'confirm': return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Confirmation</h2>
            <p className="text-slate-500 mt-2">You are about to import <span className="font-bold text-blue-600 dark:text-blue-400">{finalImportList.length}</span> assessments. New modules will need to be configured next.</p>
          </div>
      );
      case 'complete': {
        console.log('[CSV Import] Import complete:', {
          importedAssessments: finalImportList.length,
          configuredModules: configuredModules.length,
          finalAssessments: finalImportList.map(row => row.processedData),
          modules: configuredModules
        });
        return (
          <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <Icon name="Check" className="w-10 h-10 text-green-600 dark:text-green-400" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold mt-4">Import Complete!</h2>
              <p className="text-slate-500 mt-1">Successfully imported {finalImportList.length} assessments and configured {configuredModules.length} new modules.</p>
          </div>
        );
      }
    }
  };

  const nextButtonText = {
    upload: 'Next',
    map: 'Preview Data',
    preview: 'Resolve Conflicts',
    conflict: 'Confirm Selections',
    configuring: '', // Handled by child
    confirm: 'Continue to Configure Modules',
  }
  
  return (
    <div>
      <div className="min-h-[450px] flex flex-col justify-center">{renderContent()}</div>
      <div className="flex justify-between items-center pt-8">
        <div>
          {phase !== 'upload' && phase !== 'complete' && phase !== 'configuring' &&
            <button onClick={handleBackPhase} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Back</button>
          }
        </div>
        <div className="space-x-4">
          {phase === 'upload' && 
            <button onClick={onSkip} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Skip for now</button>
          }
          {phase !== 'complete' && phase !== 'configuring' &&
            <button onClick={handleNextPhase} disabled={(phase === 'upload' && !file) || (phase === 'map' && !allRequiredMapped) || (phase === 'preview' && summary?.errors > 0)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
              {phase === 'upload' ? 'Next' : nextButtonText[phase]}
            </button>
          }
        </div>
      </div>
    </div>
  );
};

const ModuleConfigurator: React.FC<{
    moduleCode: string,
    currentIndex: number,
    total: number,
    academicTerms: AcademicTerm[],
    onSave: (moduleData: Module) => void;
    onCancel: () => void;
}> = ({ moduleCode, currentIndex, total, academicTerms, onSave, onCancel }) => {
    
    // FIX: Object literal may only specify known properties, and 'termId' does not exist in type 'Omit<Module, "id" | "moduleCode">'. Replaced with 'anchorTermId'.
    const initialModuleState: Omit<Module, 'moduleCode' | 'offeringId' | 'moduleId'> = {
        moduleName: '',
        credits: 0,
        moduleType: 'Core',
        anchorTermId: academicTerms.find(t => !t.parentTermId)?.id || academicTerms[0]?.id || '',
        minFinalGrade: 50,
        targetFinalGrade: 75,
        status: 'In Progress'
    };
    
    const [moduleData, setModuleData] = useState(initialModuleState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const groupedTerms = useMemo(() => {
        const parents = academicTerms.filter(term => !term.parentTermId);
        const childrenByParentId = academicTerms.reduce((acc, term) => {
            if (term.parentTermId) {
                if (!acc[term.parentTermId]) {
                    acc[term.parentTermId] = [];
                }
                acc[term.parentTermId].push(term);
            }
            return acc;
        }, {} as Record<string, AcademicTerm[]>);

        return parents.map(parent => ({
            parent,
            children: (childrenByParentId[parent.id] || []).sort((a,b) => a.startDate.localeCompare(b.startDate))
        })).sort((a, b) => a.parent.startDate.localeCompare(b.parent.startDate));
    }, [academicTerms]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!moduleData.moduleName.trim()) newErrors.moduleName = "Module Name is required.";
        if (moduleData.credits <= 0) newErrors.credits = "Credits must be a positive number.";
        // FIX: Property 'termId' does not exist on type 'Omit<Module, "id" | "moduleCode">'. Use 'anchorTermId' instead.
        if (!moduleData.anchorTermId) newErrors.anchorTermId = "An Academic Term must be selected.";
        if (moduleData.minFinalGrade < 0 || moduleData.minFinalGrade > 100) newErrors.minFinalGrade = "Must be between 0 and 100.";
        if (moduleData.targetFinalGrade < 0 || moduleData.targetFinalGrade > 100) newErrors.targetFinalGrade = "Must be between 0 and 100.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            // FIX: Object literal may only specify known properties, and 'id' does not exist in type 'Module'. Replaced with 'offeringId' and 'moduleId'.
            onSave({ 
                ...moduleData, 
                moduleCode,
                moduleId: `mod-${moduleCode}-${new Date().getTime()}`,
                offeringId: `offering-${moduleCode}-${new Date().getTime()}`,
            } as Module);
        }
    };
    
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setModuleData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Configure New Module</h2>
                    <span className="text-sm font-medium bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">
                        {currentIndex + 1} of {total}
                    </span>
                </div>
                <p className="text-slate-500 mt-1">Please provide details for the new module: <strong className="text-slate-700 dark:text-slate-300">{moduleCode}</strong></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Inputs */}
                <InputField label="Module Name" name="moduleName" value={moduleData.moduleName} onChange={handleChange} error={errors.moduleName} placeholder="e.g. Economics" />
                <InputField label="Credits" name="credits" type="number" value={String(moduleData.credits)} onChange={handleChange} error={errors.credits} />
                
                <SelectField label="Module Type" name="moduleType" value={moduleData.moduleType} onChange={handleChange}>
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                </SelectField>

                {/* FIX: Property 'termId' does not exist on type 'Omit<Module, "id" | "moduleCode">'. Use 'anchorTermId' instead. */}
                <SelectField label="Academic Term" name="anchorTermId" value={moduleData.anchorTermId} onChange={handleChange} error={errors.anchorTermId}>
                    {groupedTerms.length === 0 && <option value="" disabled>No academic terms configured.</option>}
                    {groupedTerms.map(group => (
                        <optgroup key={group.parent.id} label={`${group.parent.termName} (${group.parent.academicYear})`}>
                            <option value={group.parent.id}>{group.parent.termName}</option>
                            {group.children.map(child => (
                                <option key={child.id} value={child.id}>&nbsp;&nbsp;↳ {child.termName}</option>
                            ))}
                        </optgroup>
                    ))}
                </SelectField>

                <InputField label="Min. Final Grade (%)" name="minFinalGrade" type="number" value={String(moduleData.minFinalGrade)} onChange={handleChange} error={errors.minFinalGrade} />
                <InputField label="Target Final Grade (%)" name="targetFinalGrade" type="number" value={String(moduleData.targetFinalGrade)} onChange={handleChange} error={errors.targetFinalGrade} />
            </div>
            
            <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={() => setShowCancelConfirm(true)} className="text-sm font-medium text-red-600 hover:underline">Cancel Import</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    Save and Next Module
                </button>
            </div>
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Cancel Import?</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">All imported assessments and new modules from this session will be permanently deleted.</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Continue</button>
                            <button onClick={onCancel} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg">Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InputField: React.FC<{label: string, name: string, value: string, onChange: any, error?: string, type?: string, placeholder?: string}> = ({label, name, value, onChange, error, type='text', placeholder}) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input type={type} name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);
const SelectField: React.FC<{label: string, name: string, value: string, onChange: any, error?: string, children: React.ReactNode}> = ({label, name, value, onChange, error, children}) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <select name={name} id={name} value={value} onChange={onChange} className={`mt-1 block w-full pl-3 pr-10 py-2 border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

export default ImportCsvStep;