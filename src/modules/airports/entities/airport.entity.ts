import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';

const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value ? parseFloat(value) : null),
};

@Entity('airports')
@Index('idx_airports_icao', ['icao'])
@Index('idx_airports_iata', ['iata'])
@Index('idx_airports_city', ['city'])
export class Airport extends BaseEntity {
  @Column({ name: 'icao', type: 'varchar', length: 50, unique: true })
  icao!: string;

  @Column({ name: 'iata', type: 'varchar', length: 50, nullable: true })
  iata?: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'city', type: 'varchar', length: 255, nullable: true })
  city?: string;

  @Column({ name: 'state', type: 'varchar', length: 255, nullable: true })
  state?: string;

  @Column({ name: 'country', type: 'varchar', length: 255, nullable: true })
  country?: string;

  @Column({
    name: 'lat',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: decimalTransformer,
  })
  lat?: number;

  @Column({
    name: 'lon',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: decimalTransformer,
  })
  lon?: number;
}
