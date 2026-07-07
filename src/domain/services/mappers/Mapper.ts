export interface Mapper<E, D, T> {
    toDTO(entity: E): D;
    toEntity(dto: D): E;
    toUpdateEntity(entity: E): T;
}