
import { GoogleGenAI, Type, FunctionDeclaration, LiveServerMessage, Modality } from "@google/genai";

// --- Standalone Text Services ---

export async function transliterateToHindi(text: string, apiKey?: string): Promise<string> {
  if (!text || text.trim().length === 0) return '';
  try {
    // Priority: Passed Key > Environment Key
    const keyToUse = apiKey || process.env.API_KEY || '';
    if (!keyToUse) throw new Error("No API Key available");

    const ai = new GoogleGenAI({ apiKey: keyToUse });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Transliterate the following English name/text into Hindi script. Return ONLY the Hindi text, nothing else. Text: "${text}"`,
    });

    return response.text ? response.text.trim() : '';
  } catch (e) {
    console.error("Transliteration failed", e);
    return '';
  }
}

// --- Tool Definitions ---
const TOOLS: FunctionDeclaration[] = [
  // --- WRITE TOOLS (CRUD) ---
  {
    name: 'add_milk_entry',
    description: 'Add or Update a milk entry. Use this to record delivery ("Mark 2L for Ramesh today") or correct mistakes ("Change Ramesh milk yesterday to 3kg").',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' },
        quantity: { type: Type.NUMBER, description: 'Quantity in KG/Liters' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format (default to today)' },
        isDelivered: { type: Type.BOOLEAN, description: 'True if delivered, false if absent' },
        slot: { type: Type.STRING, description: 'morning or evening' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'mark_delivery_range',
    description: 'Mark milk delivery status for a range of dates. Handles both DELIVERED (Present) and NOT DELIVERED (Absent/Vacation).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' },
        startDate: { type: Type.STRING, description: 'Start date YYYY-MM-DD' },
        endDate: { type: Type.STRING, description: 'End date YYYY-MM-DD' },
        isDelivered: { type: Type.BOOLEAN, description: 'TRUE if milk was given. FALSE if milk was NOT given.' },
        quantity: { type: Type.NUMBER, description: 'Optional quantity override if delivered.' },
        reason: { type: Type.STRING, description: 'Reason if not delivered (optional).' }
      },
      required: ['customerName', 'startDate', 'endDate', 'isDelivered']
    }
  },
  {
    name: 'add_payment',
    description: 'Record a payment received from a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' },
        amount: { type: Type.NUMBER, description: 'Amount in Rupees' },
        date: { type: Type.STRING, description: 'Date of payment YYYY-MM-DD (default today)' }
      },
      required: ['customerName', 'amount']
    }
  },
  {
    name: 'delete_payment',
    description: 'Delete a specific payment record. Use this if a payment was recorded by mistake.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' },
        amount: { type: Type.NUMBER, description: 'Amount of the payment to delete' },
        date: { type: Type.STRING, description: 'Date of the payment YYYY-MM-DD' }
      },
      required: ['customerName', 'amount']
    }
  },
  {
    name: 'add_new_customer',
    description: 'Create a new customer profile. You must collect Name, Rate, and Quantity.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Full name in English' },
        nameHi: { type: Type.STRING, description: 'Full name transliterated to Hindi script automatically (e.g. Ramesh -> रमेश)' },
        rate: { type: Type.NUMBER, description: 'Rate per liter/kg (Price)' },
        quantity: { type: Type.NUMBER, description: 'Default daily quantity' }
      },
      required: ['name', 'rate', 'quantity']
    }
  },
  {
    name: 'update_customer_profile',
    description: 'Update details for an existing customer. Use to change Name, Phone, Address, Rate, Quantity, or Status (Active/Inactive).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer to update' },
        phone: { type: Type.STRING, description: 'New phone number' },
        address: { type: Type.STRING, description: 'New address' },
        rate: { type: Type.NUMBER, description: 'New rate per kg' },
        defaultQty: { type: Type.NUMBER, description: 'New default daily quantity' },
        isActive: { type: Type.BOOLEAN, description: 'Set status: true for Active (Start Milk), false for Inactive (Stop Milk)' },
      },
      required: ['customerName']
    }
  },
  {
    name: 'delete_customer',
    description: 'Permanently DELETE a customer and all their data (entries, payments). WARNING: This cannot be undone.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer to delete' }
      },
      required: ['customerName']
    }
  },
  // --- CATTLE TOOLS ---
  {
    name: 'add_cattle_record',
    description: 'Record an insemination date for a cow.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cowName: { type: Type.STRING, description: 'Name of the cow' },
        cowColor: { type: Type.STRING, description: 'Color or visual ID' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format (default today)' },
      },
      required: ['cowName']
    }
  },
  {
    name: 'delete_cattle_record',
    description: 'Delete a cattle insemination record.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cowName: { type: Type.STRING, description: 'Name of the cow' },
        date: { type: Type.STRING, description: 'Insemination Date YYYY-MM-DD' }
      },
      required: ['cowName']
    }
  },
  {
    name: 'get_cattle_records',
    description: 'List all cattle insemination records.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  
  // --- READ TOOLS ---
  {
    name: 'get_customer_status',
    description: 'Get financial summary: Past Dues, Current Month Bill, Last Payment.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'check_delivery',
    description: 'Check milk delivery status for a specific date. (e.g., "Did Ramesh take milk on 5th?")',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING },
        date: { type: Type.STRING, description: 'YYYY-MM-DD' }
      },
      required: ['customerName', 'date']
    }
  },
  {
    name: 'get_payment_history',
    description: 'Get a list of recent payments made by a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING },
        limit: { type: Type.NUMBER, description: 'Number of records (default 5)' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'get_pending_list',
    description: 'Get a list of customers with Past Dues (Previous Months).',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: 'get_daily_report',
    description: 'Get a delivery report for a specific date.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' }
      },
      required: ['date']
    }
  },
  {
    name: 'get_monthly_report',
    description: 'Get total milk and revenue for a specific MONTH.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        yearMonth: { type: Type.STRING, description: 'Format YYYY-MM' }
      },
      required: ['yearMonth']
    }
  }
];

// --- Audio Utils ---

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

function pcmToFloat32(data: Int16Array): Float32Array {
  const float32 = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    float32[i] = data[i] / 32768.0;
  }
  return float32;
}

// --- Live Client Class ---

export class GeminiLive {
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private session: any = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  
  public onToolCall: ((name: string, args: any) => Promise<any>) | null = null;
  public onVisualizerData: ((volume: number) => void) | null = null;
  public onStatusChange: ((status: string) => void) | null = null;

  constructor() {}

  async connect(customerNames: string[], apiKey?: string) {
    try {
      this.onStatusChange?.("Starting...");

      // Priority: Passed Key > Environment Key
      const keyToUse = apiKey || process.env.API_KEY || '';
      if (!keyToUse) {
          throw new Error("No API Key Provided");
      }

      const ai = new GoogleGenAI({ apiKey: keyToUse });

      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      if (this.outputContext.state === 'suspended') {
        await this.outputContext.resume();
      }

      const mediaStreamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      // Updated System Instruction
      const today = new Date().toDateString();
      const currentYear = new Date().getFullYear();

      const systemInstruction = `
        You are 'Shree AI' (श्री AI), the intelligent manager for this dairy business.
        Today's date is ${today}. The current year is ${currentYear}.

        **YOUR ROLE & CAPABILITIES:**
        You have FULL CONTROL over the app's database. You can Create, Read, Update, and Delete data for Customers, Milk Entries, Payments, and Cattle Records.

        **DATA OPERATIONS:**
        1. **Attendance/Milk**: Mark deliveries for today, yesterday, or ANY date range.
           - "Mark Ramesh absent for last 3 days" -> Use \`mark_delivery_range\`.
           - "Raju took 3 liters today" -> Use \`add_milk_entry\`.
        2. **Payments**: Record payments OR delete mistakes.
           - "Received 500 from Suresh" -> \`add_payment\`.
           - "Delete the 500 rupee payment for Suresh" -> \`delete_payment\`.
        3. **Profiles**: Add new customers or UPDATE details (phone, rate, address).
           - "Change Ramesh's rate to 60" -> \`update_customer_profile\`.
        4. **Cattle**: Manage insemination records.
           - "Delete Gauri's record" -> \`delete_cattle_record\`.

        **ADD CUSTOMER PROTOCOL:**
        - Collect: Name, Quantity, Rate.
        - **AUTO-TRANSLITERATE**: If English name is given, generate 'nameHi' (Hindi) automatically.

        **HINDI LANGUAGE RULES:**
        - "Dudh gya/diya/present" -> \`isDelivered: true\`.
        - "Nahi gya/absent/cut" -> \`isDelivered: false\`.

        **SAFETY PROTOCOLS:**
        - **Deleting Customers**: Ask for confirmation before calling \`delete_customer\`.
        - **Deleting Payments**: Ensure you have the amount/date to identify the record.

        Speak in a warm, natural Hinglish (Hindi + English).
        Known Customers: ${customerNames.join(', ')}.
      `;

      this.onStatusChange?.("Connecting...");

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: TOOLS }],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          },
        },
        callbacks: {
          onopen: async () => {
            this.onStatusChange?.("Connected");
            const stream = await mediaStreamPromise;
            this.startStreaming(stream, sessionPromise);
          },
          onmessage: async (msg: LiveServerMessage) => {
             this.handleMessage(msg, sessionPromise);
          },
          onclose: () => {
            this.onStatusChange?.("Disconnected");
            this.disconnect();
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
            this.onStatusChange?.("Error");
            this.disconnect();
          }
        }
      });
      
      this.session = sessionPromise;

    } catch (err) {
      console.error("Connection Failed", err);
      this.onStatusChange?.("Connection Failed");
    }
  }

  private async startStreaming(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputContext) return;
    this.stream = stream;

    this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      let sum = 0;
      for (let i=0; i<inputData.length; i+=50) { sum += Math.abs(inputData[i]); }
      const avg = sum / (inputData.length / 50);
      this.onVisualizerData?.(avg);

      const pcm16 = floatTo16BitPCM(inputData);
      const base64Data = arrayBufferToBase64(pcm16);
      
      sessionPromise.then(session => {
          session.sendRealtimeInput({
              media: {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Data
              }
          });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputContext) {
      this.playAudio(audioData);
    }

    const toolCall = message.toolCall;
    if (toolCall && this.onToolCall) {
        const functionCalls = toolCall.functionCalls;
        const functionResponses = [];
        for (const call of functionCalls) {
            try {
                const result = await this.onToolCall(call.name, call.args);
                console.log(`Tool ${call.name} result:`, result);
                functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: result }
                });
            } catch (e) {
                console.error("Tool Execution Error", e);
                functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { error: "Failed to execute tool" }
                });
            }
        }
        if (functionResponses.length > 0) {
            sessionPromise.then(session => {
                session.sendToolResponse({ functionResponses });
            });
        }
    }

    if (message.serverContent?.interrupted) {
       this.stopAllAudio();
    }
  }

  private async playAudio(base64Data: string) {
    if (!this.outputContext) return;

    try {
        const uint8 = base64ToUint8Array(base64Data);
        const int16 = new Int16Array(uint8.buffer);
        const float32 = pcmToFloat32(int16);
        const audioBuffer = this.outputContext.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        const source = this.outputContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputContext.destination);
        source.start(this.nextStartTime);
        
        this.nextStartTime = Math.max(this.outputContext.currentTime, this.nextStartTime) + audioBuffer.duration;
        this.activeSources.add(source);
        
        source.onended = () => this.activeSources.delete(source);

    } catch (error) {
        console.error("Audio Playback Error", error);
    }
  }

  private stopAllAudio() {
      this.activeSources.forEach(source => {
          try { source.stop(); } catch(e) {}
      });
      this.activeSources.clear();
      this.nextStartTime = 0;
  }

  disconnect() {
    this.session?.then((s: any) => s.close());
    this.processor?.disconnect();
    this.inputSource?.disconnect();
    this.inputContext?.close();
    this.outputContext?.close();
    this.stopAllAudio();
    
    this.session = null;
    this.inputContext = null;
    this.outputContext = null;
  }
}
