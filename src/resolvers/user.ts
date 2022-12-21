import { User } from "../entities/User";
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import argon2 from "argon2";
import { UserMutationResponse } from "../types/UserMutationResponse";
import { RegisterInput } from "../types/RegisterInput";
import { validateRegisterInput } from "../utils/validateRegisterInput";
import { LoginInput } from "../types/LoginInput";
import { Context } from "../types/Context";
import { COOKIE_NAME } from "../constants";

@Resolver()
export class UserResolver {
    @Mutation((_return) => UserMutationResponse)
    async register(
        @Arg("registerInput") registerInput: RegisterInput,
        @Ctx() {req} : Context
    ): Promise<UserMutationResponse> {
        const validateRegisterInputError = validateRegisterInput(registerInput);
        if (validateRegisterInputError !== null) {
            return {
                code: 400,
                success: false,
                ...validateRegisterInputError,
            };
        }

        try {
            const { username, password, email } = registerInput;

            const existingUser = await User.findOne({
                where: [{ username }, { email }],
            });
            if (existingUser) {
                return {
                    code: 400,
                    success: false,
                    message: "Duplicate username or email",
                    errors: [
                        {
                            field:
                                existingUser.username === username
                                    ? "username"
                                    : "email",
                            message: `${
                                existingUser.username === username
                                    ? "username"
                                    : "email"
                            } already taken`,
                        },
                    ],
                };
            }

            const hashedPassword = await argon2.hash(password);

            let newUser = User.create({
                username,
                password: hashedPassword,
                email,
            });
            newUser = await User.save(newUser)

            req.session.userId = newUser.id

            return {
                code: 200,
                success: true,
                message: "User registration successful",
                user: newUser,
            };
        } catch (error) {
            return {
                code: 500,
                success: false,
                message: `Internal server error ${error.message}`,
            };
        }
    }

    @Mutation(_return => UserMutationResponse)
	async login(
		@Arg('loginInput') { usernameOrEmail, password }: LoginInput,
        @Ctx() {req} : Context
	): Promise<UserMutationResponse> {
		try {
            const accout = usernameOrEmail.includes('@') ? { email: usernameOrEmail } : { username: usernameOrEmail };

            // existing = hiện có
			const existingUser = await User.findOne({ where: accout })

			if (!existingUser) {
                return {
					code: 400,
					success: false,
					message: 'User not found',
					errors: [
						{ field: 'usernameOrEmail', message: 'Username or email incorrect' }
					]
				}
            }

			const passwordValid = await argon2.verify(existingUser.password, password)

			if (!passwordValid) {
                return {
					code: 400,
					success: false,
					message: 'Wrong password',
					errors: [{ field: 'password', message: 'Wrong password' }]
				}
            }

            // Session: userId = existingUser.id
            // Create session and retun cookie
            req.session.userId = existingUser.id

			return {
				code: 200,
				success: true,
				message: 'Logged in successfully',
				user: existingUser
			}
		} catch (error) {
			console.log(error)
			return {
				code: 500,
				success: false,
				message: `Internal server error ${error.message}`
			}
		}
	}

    @Mutation(_return => Boolean)
    logout(
        @Ctx() {req, res} : Context
    ): Promise<boolean> {
        return new Promise((resolver, _reject) => {
            res.clearCookie(COOKIE_NAME)
            req.session.destroy(error => {
                if(error){
                    console.log('DESTROYING SESSION ERROR ', error)
                    resolver(false)
                }
                else {
                    resolver(true)
                }
            })
        })
    }
}
