import { LoginInput } from "../types/LoginInput";

export const validateLoginInput = (loginInput: LoginInput) => {
    // if (!loginInput.email.includes("@")) {
    //     return {
    //         message: "Invalid email",
    //         errors: [
    //             { field: "email", message: "Email must inlcude @ symbol" },
    //         ],
    //     };
    // }

    // if (loginInput.username.length <= 2) {
    //     return [
    //         {
    //             message: "Invalid username",
    //             errors: [
    //                 {
    //                     field: "username",
    //                     message: "Length must be greater than 2",
    //                 },
    //             ],
    //         },
    //     ];
    // }

    // if (loginInput.username.includes("@")) {
    //     return [
    //         {
    //             message: "Invalid username",
    //             errors: [
    //                 {
    //                     field: "username",
    //                     message: "Length must be greater than 2",
    //                 },
    //             ],
    //         },
    //     ];
    // }

    if (loginInput.password.length <= 2) {
        return [
            {
                message: "Invalid password",
                errors: [
                    {
                        field: "password",
                        message: "Length must be greater than 2",
                    },
                ],
            },
        ];
    }

    return null
};
