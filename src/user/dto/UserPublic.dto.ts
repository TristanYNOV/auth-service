export class UserPublicDto {
  id: string;
  pseudo: string;
  email: string;
}

type UserPublicSource = {
  _id: unknown;
  pseudo: string;
  email: string;
};

type UserLike = UserPublicSource | { toObject(): UserPublicSource };

function hasToObject(user: UserLike): user is { toObject(): UserPublicSource } {
  return typeof (user as { toObject?: unknown }).toObject === 'function';
}

export function toUserPublicDto(user: UserLike): UserPublicDto {
  const source = hasToObject(user) ? user.toObject() : user;

  return {
    id: String(source._id),
    pseudo: source.pseudo,
    email: source.email,
  };
}
