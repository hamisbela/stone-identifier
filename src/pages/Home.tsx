import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Mountain, Loader2 } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import SupportBlock from '../components/SupportBlock';

// Default stone image path
const DEFAULT_IMAGE = "/default-stone.webp";

// Default analysis for the stone
const DEFAULT_ANALYSIS = `1. Stone Identification:
- Name: Granite
- Type: Igneous rock
- Color: Typically pink, white, gray, or black
- Texture: Phaneritic (coarse-grained)
- Composition: Quartz, feldspar, mica, and amphibole

2. Physical Properties:
- Hardness: 6-7 on Mohs scale
- Density: 2.65-2.75 g/cm³
- Porosity: Low (0.5-1.5%)
- Grain Size: Medium to coarse
- Fracture: Irregular/uneven
- Formation: Slow cooling of magma beneath Earth's surface

3. Geological Significance:
- Age: Varies widely, often hundreds of millions of years old
- Environment: Forms deep within the Earth's crust
- Distribution: Found on all continents
- Associated Rocks: Often found with diorite, gabbro, and rhyolite
- Geological Setting: Plutonic (intrusive igneous) environments

4. Historical & Practical Uses:
- Construction: Building material, countertops, floor tiles, monuments
- Historical Significance: Used in ancient Egyptian pyramids, Roman structures
- Modern Applications: Kitchen countertops, building facades, paving
- Cultural Importance: Symbol of strength and durability in many cultures
- Famous Examples: Mount Rushmore, many historical monuments

5. Additional Information:
- Weathering: Resistant to weathering but can break down to form sandy soil
- Economic Value: Widely quarried worldwide for construction
- Similar Stones: Diorite, gabbro, granodiorite
- Interesting Facts: One of the most abundant rocks in continental crust
- Care: Requires sealing for indoor use to prevent staining`;

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default image and analysis without API call
    const loadDefaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(DEFAULT_IMAGE);
        if (!response.ok) {
          throw new Error('Failed to load default image');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImage(base64data);
          setAnalysis(DEFAULT_ANALYSIS);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load default image');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading default image:', err);
        setError('Failed to load default image');
        setLoading(false);
      }
    };

    loadDefaultContent();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size should be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setError(null);
      handleAnalyze(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleAnalyze = async (imageData: string) => {
    setLoading(true);
    setError(null);
    const stonePrompt = "Analyze this stone image for educational purposes and provide the following information:\n1. Stone identification (name, type, color, texture, composition)\n2. Physical properties (hardness, density, porosity, grain size, fracture)\n3. Geological significance (age, environment, distribution, associated rocks)\n4. Historical and practical uses (construction, historical significance, modern applications)\n5. Additional information (weathering, economic value, similar stones, interesting facts)\n\nIMPORTANT: This is for educational purposes only.";
    try {
      const result = await analyzeImage(imageData, stonePrompt);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove any markdown-style formatting
      const cleanLine = line.replace(/[*_#`]/g, '').trim();
      if (!cleanLine) return null;

      // Format section headers (lines starting with numbers)
      if (/^\d+\./.test(cleanLine)) {
        return (
          <div key={index} className="mt-8 first:mt-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {cleanLine.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
        );
      }
      
      // Format list items with specific properties
      if (cleanLine.startsWith('-') && cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.substring(1).split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="font-semibold text-gray-800 min-w-[120px]">{label.trim()}:</span>
            <span className="text-gray-700">{value}</span>
          </div>
        );
      }
      
      // Format regular list items
      if (cleanLine.startsWith('-')) {
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={index} className="mb-3 text-gray-700">
          {cleanLine}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Free Stone Identifier</h1>
          <p className="text-base sm:text-lg text-gray-600">Upload a stone photo for educational identification and geological information</p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <label 
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Upload Stone Photo
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageUpload}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">PNG, JPG or JPEG (MAX. 20MB)</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && !image && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-stone-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {image && (
            <div className="mb-6">
              <div className="relative rounded-lg mb-4 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Stone preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnalyze(image)}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-stone-600 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Mountain className="-ml-1 mr-2 h-5 w-5" />
                      Identify Stone
                    </>
                  )}
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Another Photo
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Stone Analysis Results</h2>
              <div className="text-gray-700">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>

        <SupportBlock />

        <div className="prose max-w-none my-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Free Stone Identifier: Your Educational Guide to Geology</h2>
          
          <p>Welcome to our free stone identifier tool, powered by advanced artificial intelligence technology.
             This educational tool helps you learn about different rocks and stones, their properties, and
             essential information about their geological and historical significance.</p>

          <h3>How Our Educational Stone Identifier Works</h3>
          <p>Our tool uses AI to analyze stone photos and provide educational information about rock
             identification, physical properties, and geological attributes. Simply upload a clear photo of a stone,
             and our AI will help you learn about its type and characteristics.</p>

          <h3>Key Features of Our Stone Identifier</h3>
          <ul>
            <li>Educational geological information</li>
            <li>Detailed physical properties</li>
            <li>Formation and origin details</li>
            <li>Historical and practical uses</li>
            <li>Care and value information</li>
            <li>100% free to use</li>
          </ul>

          <h3>Perfect For Learning About:</h3>
          <ul>
            <li>Rock and stone identification</li>
            <li>Geological properties and characteristics</li>
            <li>Formation processes and environments</li>
            <li>Historical uses and cultural significance</li>
            <li>Stone care and collection</li>
          </ul>

          <p>Try our free stone identifier today and expand your knowledge of geology!
             No registration required - just upload a photo and start learning about fascinating stones from around the world.</p>
        </div>

        <SupportBlock />
      </div>
    </div>
  );
}