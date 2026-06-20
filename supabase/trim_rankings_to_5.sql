-- Trim any position that has more than 5 ranked players down to the top 5.
-- Rankings are stored as { "P": [id1, id2, ...], "C": [...], ... }.
-- We keep the first 5 elements (index 0–4), which are already in rank order.

update lineup_rankings
set rankings = (
  select jsonb_object_agg(
    key,
    case
      when jsonb_array_length(value) > 5 then (
        select jsonb_agg(elem order by ord)
        from jsonb_array_elements(value) with ordinality as t(elem, ord)
        where ord <= 5
      )
      else value
    end
  )
  from jsonb_each(rankings)
)
where exists (
  select 1
  from jsonb_each(rankings)
  where jsonb_array_length(value) > 5
);
