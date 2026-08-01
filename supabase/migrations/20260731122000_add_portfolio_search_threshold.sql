/*
  Adds thresholded CLIP search for portfolio images.

  similarity is calculated as:
    1 - cosine_distance

  A threshold of 0.25 is a conservative starting point for CLIP search. It helps
  remove weak, unrelated matches while still returning enough results while the
  portfolio has a smaller set of real photos.
*/
create or replace function public.match_portfolio_images(
  query_embedding vector(512),
  match_count integer default 12,
  match_threshold double precision default 0.25
)
returns table (
  id text,
  category text,
  image_url text,
  similarity double precision
)
language sql
stable
as $$
  select
    portfolio_images.id::text as id,
    portfolio_images.category::text as category,
    portfolio_images.image_url::text as image_url,
    1 - (portfolio_images.embedding <=> query_embedding) as similarity
  from public.portfolio_images
  where portfolio_images.embedding is not null
    and 1 - (portfolio_images.embedding <=> query_embedding) > match_threshold
  order by portfolio_images.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_portfolio_images(
  vector(512),
  integer,
  double precision
) to anon, authenticated;
