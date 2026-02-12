
alter table tournaments add column registration_price numeric default 0;
alter table pairs add column player1_paid boolean default false;
alter table pairs add column player2_paid boolean default false;

