-- Add authorReason field to rebuttals table to store the author's initial comment when invoking a rebuttal
ALTER TABLE rebuttals ADD COLUMN author_reason TEXT;
