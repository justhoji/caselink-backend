import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';
import { TourPackage } from '@/modules/packages/entities/tour-package.entity';

@Entity('package_flights')
export class PackageFlight extends BaseEntity {
  @Column({ name: 'package_id', type: 'uuid' })
  packageId!: string;

  @Column()
  airline!: string;

  @Column({ name: 'flight_number', nullable: true })
  flightNumber!: string;

  @Column({ name: 'departure_airport' })
  departureAirport!: string;

  @Column({ name: 'arrival_airport' })
  arrivalAirport!: string;

  @Column({ name: 'departure_time', type: 'timestamptz', nullable: true })
  departureTime!: Date;

  @Column({ name: 'arrival_time', type: 'timestamptz', nullable: true })
  arrivalTime!: Date;

  @Column({ name: 'is_return_flight', default: false })
  isReturnFlight!: boolean;

  @Column({ name: 'is_luggage_included', default: true })
  isLuggageIncluded!: boolean;

  @Column({ name: 'luggage_allowance', nullable: true })
  luggageAllowance?: string;

  @ManyToOne(() => TourPackage, (pkg) => pkg.flights, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package!: TourPackage;
}
