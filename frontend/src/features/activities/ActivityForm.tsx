import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { errorMessage } from '../../lib/api';
import { Field, FormButtons, TextArea, TextInput, formStyles } from '../../ui/Field';
import { Picker } from '../../ui/Picker';
import { Select } from '../../ui/Select';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { useContacts } from '../contacts/api';
import { useDeals } from '../deals/api';
import { useSaveActivity, type Activity } from './api';

export interface ActivityPreset {
  contact_id?: number | null;
  deal_id?: number | null;
}

const fields = z.object({
  type: z.enum(['note', 'call', 'email']),
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description')
    .max(5000, 'Keep the description to 5,000 characters or fewer'),
  occurred_at: z.string().min(1, 'Enter when it happened'),
  contact_id: z.number().nullable(),
  deal_id: z.number().nullable(),
  follow_up_date: z.string(),
});
/** DATA-6: a note, call or email needs a contact, a deal or both. */
const linked = fields.refine((v) => v.contact_id !== null || v.deal_id !== null, {
  message: 'Choose a contact, a deal or both',
  path: ['contact_id'],
});
export type ActivityValues = z.infer<typeof fields>;

const local = (iso: string) => format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");

/** Log or edit an activity (REC-10). A stage-change entry can only have its words and time edited (REC-8). */
export function ActivitySheet({
  open,
  onOpenChange,
  activity,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity;
  preset?: ActivityPreset;
}) {
  const title = !activity ? 'Log activity' : activity.type === 'stage_change' ? 'Edit stage change' : 'Edit activity';
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      {open && <ActivityForm activity={activity} preset={preset} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}

/** The form's starting values: the activity's, or a note from now with any preset links. */
function startingValues(activity?: Activity, preset?: ActivityPreset): ActivityValues {
  if (!activity) {
    return {
      type: 'note',
      description: '',
      occurred_at: local(new Date().toISOString()),
      contact_id: preset?.contact_id ?? null,
      deal_id: preset?.deal_id ?? null,
      follow_up_date: '',
    };
  }
  return {
    type: activity.type === 'stage_change' ? 'note' : activity.type,
    description: activity.description,
    occurred_at: local(activity.occurred_at),
    contact_id: activity.contact_id,
    deal_id: activity.deal_id,
    follow_up_date: activity.follow_up_date ?? '',
  };
}

export function ActivityForm({
  activity,
  preset,
  onDone,
}: {
  activity?: Activity;
  preset?: ActivityPreset;
  onDone: () => void;
}) {
  const save = useSaveActivity();
  const toast = useToast();
  const contacts = useContacts().data ?? [];
  const deals = useDeals().data ?? [];
  const stageChange = activity?.type === 'stage_change';
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityValues>({
    // A stage-change entry keeps its links, so only the other kinds are checked for one.
    resolver: zodResolver(stageChange ? fields : linked),
    defaultValues: startingValues(activity, preset),
  });

  async function submit(values: ActivityValues) {
    setFormError(null);
    try {
      await save.mutateAsync({
        id: activity?.id,
        values: {
          type: values.type,
          description: values.description,
          occurred_at: new Date(values.occurred_at).toISOString(),
          contact_id: values.contact_id,
          deal_id: values.deal_id,
          follow_up_date: values.follow_up_date || null,
        },
      });
      toast(activity ? 'Activity saved' : 'Activity logged');
      onDone();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit(submit)} noValidate aria-label="Activity">
      <div className={formStyles.fields}>
        {formError && (
          <p className={formStyles.formError} role="alert">
            {formError}
          </p>
        )}
        {!stageChange && (
          <Field label="Type" htmlFor="activity-type">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  id="activity-type"
                  label="Type"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'note', label: 'Note' },
                    { value: 'call', label: 'Call' },
                    { value: 'email', label: 'Email' },
                  ]}
                />
              )}
            />
          </Field>
        )}
        <Field label="Description" htmlFor="activity-description" error={errors.description?.message}>
          <TextArea
            id="activity-description"
            data-autofocus
            rows={4}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
        </Field>
        <Field label="When" htmlFor="activity-when" error={errors.occurred_at?.message}>
          <TextInput id="activity-when" type="datetime-local" className="mono" {...register('occurred_at')} />
        </Field>
        {!stageChange && (
          <>
            <Field label="Contact" htmlFor="activity-contact" error={errors.contact_id?.message}>
              <Controller
                control={control}
                name="contact_id"
                render={({ field }) => (
                  <Picker
                    id="activity-contact"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Choose a contact"
                    noneLabel="No contact"
                    invalid={!!errors.contact_id}
                    options={contacts.map((c) => ({ value: c.id, label: c.name, hint: c.organization_name }))}
                  />
                )}
              />
            </Field>
            <Field label="Deal" htmlFor="activity-deal">
              <Controller
                control={control}
                name="deal_id"
                render={({ field }) => (
                  <Picker
                    id="activity-deal"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Choose a deal"
                    noneLabel="No deal"
                    options={deals.map((d) => ({ value: d.id, label: d.name, hint: d.organization_name }))}
                  />
                )}
              />
            </Field>
            <Field
              label="Follow-up date"
              htmlFor="activity-follow-up"
              hint="Optional. It shows on the dashboard until it's done."
            >
              <TextInput id="activity-follow-up" type="date" {...register('follow_up_date')} />
            </Field>
          </>
        )}
      </div>
      <FormButtons saving={save.isPending} onCancel={onDone} />
    </form>
  );
}
