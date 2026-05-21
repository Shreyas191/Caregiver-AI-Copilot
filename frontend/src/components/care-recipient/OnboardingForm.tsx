'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

import { api } from '@/lib/api';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ── Types & schema ─────────────────────────────────────────── */
const formSchema = z.object({
  display_name: z.string().min(1, 'Name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  sex_at_birth: z.enum(['male', 'female', 'intersex', 'unknown']),
  conditions: z.array(
    z.object({
      name: z.string().min(1, 'Condition name is required'),
      icd10_code: z.string().optional(),
      diagnosed_date: z.string().optional(),
    })
  ),
  allergies: z.array(
    z.object({
      substance: z.string().min(1, 'Substance is required'),
      reaction: z.string().optional(),
      severity: z.string().optional(),
    })
  ),
  primary_provider_name: z.string().optional(),
  primary_provider_email: z.string().email('Invalid email').optional().or(z.literal('')),
  primary_provider_phone: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  consent_basis: z.enum([
    'power_of_attorney',
    'healthcare_proxy',
    'parental_responsibility',
    'informal_arrangement',
    'self',
  ]),
  baseline_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/* ── Step config ────────────────────────────────────────────── */
const STEPS = {
  1: { label: 'Basic Info',  title: 'Who are you caring for?',   sub: 'Start with the basics — name, date of birth, and sex at birth.' },
  2: { label: 'Conditions',  title: 'Medical Conditions',        sub: 'Add any known diagnoses, chronic illnesses, or recent conditions.' },
  3: { label: 'Allergies',   title: 'Allergies',                 sub: 'Add known allergies to medications, food, or environment.' },
  4: { label: 'Contacts',    title: 'Care Contacts',             sub: 'Primary care provider and an emergency contact.' },
  5: { label: 'Consent',     title: 'Consent & Notes',           sub: 'Confirm your relationship and add any baseline health notes.' },
} as const;

const TOTAL = 5;

/* ── Style helpers ──────────────────────────────────────────── */
const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };
const MONO: React.CSSProperties  = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <FormLabel
      className="text-xs font-medium uppercase tracking-[0.12em] leading-none"
      style={{ ...MONO, color: 'var(--muted-foreground)' }}
    >
      {children}
    </FormLabel>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg mb-1" style={SERIF}>
      {children}
    </h3>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getToken } = useAuth();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: '',
      date_of_birth: '',
      sex_at_birth: 'unknown',
      conditions: [],
      allergies: [],
      primary_provider_name: '',
      primary_provider_email: '',
      primary_provider_phone: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      consent_basis: 'self',
      baseline_notes: '',
    },
  });

  const { fields: conditionFields, append: appendCondition, remove: removeCondition } = useFieldArray({
    control: form.control,
    name: 'conditions',
  });

  const { fields: allergyFields, append: appendAllergy, remove: removeAllergy } = useFieldArray({
    control: form.control,
    name: 'allergies',
  });

  const nextStep = async () => {
    const fieldsMap: Record<number, any[]> = {
      1: ['display_name', 'date_of_birth', 'sex_at_birth'],
      2: ['conditions'],
      3: ['allergies'],
      4: ['primary_provider_name', 'primary_provider_email', 'primary_provider_phone', 'emergency_contact_name', 'emergency_contact_phone'],
    };
    const isValid = await form.trigger(fieldsMap[step] ?? []);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const payload = {
        ...data,
        primary_provider_name: data.primary_provider_name || undefined,
        primary_provider_email: data.primary_provider_email || undefined,
        primary_provider_phone: data.primary_provider_phone || undefined,
        emergency_contact_name: data.emergency_contact_name || undefined,
        emergency_contact_phone: data.emergency_contact_phone || undefined,
        baseline_notes: data.baseline_notes || undefined,
      };
      const response = await api.careRecipients.create(token!, payload);
      router.push(`/care-recipients/${response.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create care recipient');
      setIsSubmitting(false);
    }
  };

  const current = STEPS[step as keyof typeof STEPS];

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(26,26,26,0.06)',
      }}
    >
      {/* ── Progress & step header ─────────────────────────────── */}
      <div className="px-7 pt-7 pb-6">
        {/* Progress track */}
        <div className="w-full h-px mb-6 rounded-full" style={{ background: 'var(--border)' }}>
          <div
            className="h-px rounded-full transition-all duration-500"
            style={{ width: `${(step / TOTAL) * 100}%`, background: 'var(--accent)' }}
          />
        </div>

        {/* Step label */}
        <p
          className="text-xs font-medium uppercase tracking-[0.15em] mb-2"
          style={{ ...MONO, color: 'var(--accent)' }}
        >
          Step {step} of {TOTAL} — {current.label}
        </p>
        <h2 className="text-2xl mb-1" style={SERIF}>{current.title}</h2>
        <p className="text-sm leading-[1.75]" style={{ color: 'var(--muted-foreground)' }}>
          {current.sub}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px mx-7" style={{ background: 'var(--border)' }} />

      {/* ── Form body ──────────────────────────────────────────── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="px-7 py-7">

            {/* ── Step 1: Basic info ── */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Full Name *</FieldLabel>
                      <FormControl>
                        <Input placeholder="Eleanor Kaldate" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>Date of Birth *</FieldLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sex_at_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>Sex at Birth *</FieldLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="intersex">Intersex</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* ── Step 2: Conditions ── */}
            <div className={step === 2 ? 'block' : 'hidden'}>
              <div className="space-y-3">
                {conditionFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-5 rounded-lg flex gap-4 items-start"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <FormField
                        control={form.control}
                        name={`conditions.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel>Condition *</FieldLabel>
                            <FormControl>
                              <Input placeholder="Type 2 Diabetes" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`conditions.${index}.icd10_code`}
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel>ICD-10</FieldLabel>
                            <FormControl>
                              <Input placeholder="E11.9" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`conditions.${index}.diagnosed_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel>Diagnosed</FieldLabel>
                            <FormControl>
                              <Input placeholder="YYYY or YYYY-MM" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="mt-5 shrink-0 transition-colors duration-200"
                      style={{ color: 'var(--muted-foreground)' }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9A3412'; }}
                      onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendCondition({ name: '', icd10_code: '', diagnosed_date: '' })}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-lg transition-colors duration-200"
                  style={{
                    border: '1px dashed var(--accent)',
                    color: 'var(--accent)',
                    background: 'rgba(184,134,11,0.03)',
                    ...MONO,
                    fontSize: '0.7rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Condition
                </button>
                {conditionFields.length === 0 && (
                  <p className="text-center text-sm py-2" style={{ color: 'var(--muted-foreground)' }}>
                    No conditions added yet — that&apos;s fine, you can skip this step.
                  </p>
                )}
              </div>
            </div>

            {/* ── Step 3: Allergies ── */}
            <div className={step === 3 ? 'block' : 'hidden'}>
              <div className="space-y-3">
                {allergyFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-5 rounded-lg flex gap-4 items-start"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <FormField
                        control={form.control}
                        name={`allergies.${index}.substance`}
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel>Substance *</FieldLabel>
                            <FormControl>
                              <Input placeholder="Penicillin" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`allergies.${index}.reaction`}
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel>Reaction</FieldLabel>
                            <FormControl>
                              <Input placeholder="Hives, rash…" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`allergies.${index}.severity`}
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel>Severity</FieldLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select…" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mild">Mild</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      className="mt-5 shrink-0 transition-colors duration-200"
                      style={{ color: 'var(--muted-foreground)' }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9A3412'; }}
                      onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendAllergy({ substance: '', reaction: '', severity: '' })}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-lg transition-colors duration-200"
                  style={{
                    border: '1px dashed var(--accent)',
                    color: 'var(--accent)',
                    background: 'rgba(184,134,11,0.03)',
                    ...MONO,
                    fontSize: '0.7rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Allergy
                </button>
                {allergyFields.length === 0 && (
                  <p className="text-center text-sm py-2" style={{ color: 'var(--muted-foreground)' }}>
                    No allergies added — you can always add them later from the profile.
                  </p>
                )}
              </div>
            </div>

            {/* ── Step 4: Contacts ── */}
            <div className={step === 4 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div>
                  <SectionTitle>Primary Care Provider</SectionTitle>
                  <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Optional — you can add this later.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="primary_provider_name"
                      render={({ field }) => (
                        <FormItem>
                          <FieldLabel>Provider Name</FieldLabel>
                          <FormControl><Input placeholder="Dr. Smith" {...field} /></FormControl>
                          <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="primary_provider_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FieldLabel>Phone</FieldLabel>
                          <FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="primary_provider_email"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FieldLabel>Email</FieldLabel>
                          <FormControl><Input placeholder="dr.smith@clinic.com" {...field} /></FormControl>
                          <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="h-px" style={{ background: 'var(--border)' }} />

                <div>
                  <SectionTitle>Emergency Contact</SectionTitle>
                  <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Optional — who to reach in an emergency.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="emergency_contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FieldLabel>Contact Name</FieldLabel>
                          <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FieldLabel>Phone</FieldLabel>
                          <FormControl><Input placeholder="(555) 987-6543" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 5: Consent & notes ── */}
            <div className={step === 5 ? 'block' : 'hidden'}>
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="consent_basis"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Your Relationship *</FieldLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="self">Self (I am the recipient)</SelectItem>
                          <SelectItem value="power_of_attorney">Power of Attorney</SelectItem>
                          <SelectItem value="healthcare_proxy">Healthcare Proxy</SelectItem>
                          <SelectItem value="parental_responsibility">Parental Responsibility</SelectItem>
                          <SelectItem value="informal_arrangement">Informal Arrangement</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseline_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Baseline Notes</FieldLabel>
                      <FormControl>
                        <Textarea
                          placeholder="General notes about baseline health, mobility, communication preferences, or anything the assistant should know…"
                          className="resize-none"
                          style={{ minHeight: '120px' }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" style={{ color: '#9A3412' }} />
                    </FormItem>
                  )}
                />

                {error && (
                  <div
                    className="p-4 rounded-lg text-sm leading-[1.6]"
                    style={{ background: '#FEE8E8', border: '1px solid #F4AAAA', color: '#7F1D1D' }}
                  >
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer navigation ──────────────────────────────── */}
          <div
            className="px-7 py-5 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || isSubmitting}
              className="btn-outline-serif h-10 px-5 text-sm flex items-center gap-1.5 min-h-[40px] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: step === i + 1 ? '20px' : '6px',
                    height: '6px',
                    background: i + 1 <= step ? 'var(--accent)' : 'var(--border)',
                  }}
                />
              ))}
            </div>

            {step < TOTAL ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-gold h-10 px-5 text-sm flex items-center gap-1.5 min-h-[40px]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="btn-gold h-10 px-6 text-sm min-h-[40px] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving…' : 'Complete Profile'}
              </button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
