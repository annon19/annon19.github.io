create trigger tickTrigger after insert on tick
BEGIN
  SELECT tick();
end;