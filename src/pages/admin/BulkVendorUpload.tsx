import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VendorCategory } from '@/types/database';

const VALID_CATEGORIES: VendorCategory[] = ['decor', 'catering', 'livestock', 'tents', 'transport', 'attire', 'photographer', 'other'];

const vendorRowSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  category: z.enum(['decor', 'catering', 'livestock', 'tents', 'transport', 'attire', 'photographer', 'other'], {
    errorMap: () => ({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` })
  }),
  location: z.string().max(100).optional().nullable(),
  about: z.string().max(2000).optional().nullable(),
  price_range_text: z.string().max(100).optional().nullable(),
  phone_number: z.string().max(20).optional().nullable(),
  whatsapp_number: z.string().max(20).optional().nullable(),
  email: z.string().email().max(255).optional().nullable().or(z.literal('')),
  website_url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  languages: z.string().optional().nullable(),
});

interface ParsedVendor {
  row: number;
  data: {
    name: string;
    category: VendorCategory;
    location?: string | null;
    about?: string | null;
    price_range_text?: string | null;
    phone_number?: string | null;
    whatsapp_number?: string | null;
    email?: string | null;
    website_url?: string | null;
    languages?: string[];
  };
  isValid: boolean;
  errors: string[];
}

export default function BulkVendorUpload() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [parsedData, setParsedData] = useState<ParsedVendor[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  if (!isAdmin) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="Bulk Upload" showBack />
        <div className="px-4 py-12 text-center">
          <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsed: ParsedVendor[] = jsonData.map((row: any, index: number) => {
          const cleanedRow = {
            name: String(row.name || '').trim(),
            category: String(row.category || '').trim().toLowerCase(),
            location: row.location ? String(row.location).trim() : null,
            about: row.about ? String(row.about).trim() : null,
            price_range_text: row.price_range_text ? String(row.price_range_text).trim() : null,
            phone_number: row.phone_number ? String(row.phone_number).trim() : null,
            whatsapp_number: row.whatsapp_number ? String(row.whatsapp_number).trim() : null,
            email: row.email ? String(row.email).trim() : null,
            website_url: row.website_url ? String(row.website_url).trim() : null,
            languages: row.languages ? String(row.languages).trim() : null,
          };

          const validation = vendorRowSchema.safeParse(cleanedRow);
          
          if (validation.success) {
            const languagesArray = cleanedRow.languages 
              ? cleanedRow.languages.split(',').map(l => l.trim()).filter(Boolean)
              : ['English'];

            return {
              row: index + 2,
              data: {
                ...cleanedRow,
                category: cleanedRow.category as VendorCategory,
                languages: languagesArray,
                email: cleanedRow.email || null,
                website_url: cleanedRow.website_url || null,
              },
              isValid: true,
              errors: [],
            };
          } else {
            return {
              row: index + 2,
              data: cleanedRow as any,
              isValid: false,
              errors: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            };
          }
        });

        setParsedData(parsed);
        setUploadComplete(false);
        toast.success(`Parsed ${parsed.length} rows from file`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleUpload = async () => {
    const validVendors = parsedData.filter(v => v.isValid);
    if (validVendors.length === 0) {
      toast.error('No valid vendors to upload');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let failedCount = 0;

    for (const vendor of validVendors) {
      const { error } = await supabase.from('vendors').insert({
        name: vendor.data.name,
        category: vendor.data.category,
        location: vendor.data.location,
        about: vendor.data.about,
        price_range_text: vendor.data.price_range_text,
        phone_number: vendor.data.phone_number,
        whatsapp_number: vendor.data.whatsapp_number,
        email: vendor.data.email,
        website_url: vendor.data.website_url,
        languages: vendor.data.languages,
        is_active: true,
        owner_user_id: null,
      });

      if (error) {
        console.error('Error inserting vendor:', error);
        failedCount++;
      } else {
        successCount++;
      }
    }

    setIsUploading(false);
    setUploadComplete(true);
    setUploadResults({ success: successCount, failed: failedCount });
    
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} vendors`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to upload ${failedCount} vendors`);
    }
  };

  const validCount = parsedData.filter(v => v.isValid).length;
  const invalidCount = parsedData.filter(v => !v.isValid).length;

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Bulk Vendor Upload" showBack />

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Vendors from Excel/CSV
            </CardTitle>
            <CardDescription>
              Upload a spreadsheet with vendor data. The file should have columns matching the required fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="font-medium">Required columns:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>name</strong> - Business name (required)</li>
                <li><strong>category</strong> - One of: decor, catering, livestock, tents, transport, attire, photographer, other (required)</li>
              </ul>
              <p className="font-medium mt-4">Optional columns:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>location</strong> - Service area</li>
                <li><strong>about</strong> - Business description</li>
                <li><strong>price_range_text</strong> - Pricing info</li>
                <li><strong>phone_number</strong> - Contact phone</li>
                <li><strong>whatsapp_number</strong> - WhatsApp number</li>
                <li><strong>email</strong> - Business email</li>
                <li><strong>website_url</strong> - Website URL</li>
                <li><strong>languages</strong> - Comma-separated (e.g., "English, Zulu")</li>
              </ul>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">Excel (.xlsx, .xls) or CSV files</p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {parsedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview ({parsedData.length} rows)</span>
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {invalidCount} invalid
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead className="w-16">Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((vendor, idx) => (
                      <TableRow key={idx} className={!vendor.isValid ? 'bg-destructive/10' : ''}>
                        <TableCell>{vendor.row}</TableCell>
                        <TableCell>
                          {vendor.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{vendor.data.name || '-'}</TableCell>
                        <TableCell>{vendor.data.category || '-'}</TableCell>
                        <TableCell>{vendor.data.location || '-'}</TableCell>
                        <TableCell>{vendor.data.phone_number || '-'}</TableCell>
                        <TableCell className="text-destructive text-xs">
                          {vendor.errors.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {!uploadComplete && (
                <div className="mt-4 flex gap-3">
                  <Button 
                    onClick={handleUpload} 
                    disabled={validCount === 0 || isUploading}
                    className="flex-1"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${validCount} Valid Vendors`}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setParsedData([])}
                  >
                    Clear
                  </Button>
                </div>
              )}

              {uploadComplete && (
                <div className="mt-4 p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Upload Complete</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {uploadResults.success} vendors uploaded successfully
                    {uploadResults.failed > 0 && `, ${uploadResults.failed} failed`}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/vendors')}>
                      View Vendors
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setParsedData([]);
                      setUploadComplete(false);
                    }}>
                      Upload More
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Download Template */}
        <Card>
          <CardContent className="p-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                const ws = XLSX.utils.json_to_sheet([
                  {
                    name: 'Example Vendor',
                    category: 'catering',
                    location: 'Durban, KZN',
                    about: 'We provide catering services for traditional ceremonies',
                    price_range_text: 'From R150 per head',
                    phone_number: '+27821234567',
                    whatsapp_number: '+27821234567',
                    email: 'info@example.com',
                    website_url: 'https://example.com',
                    languages: 'English, Zulu'
                  }
                ]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
                XLSX.writeFile(wb, 'vendor_upload_template.xlsx');
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
