import User from "../models/User.models.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import jwt from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/*                           HELPER FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Generates a JWT token for the given user ID.
 * Expires in 30 days.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/* -------------------------------------------------------------------------- */
/*                             REGISTER USER                                  */
/* -------------------------------------------------------------------------- */
/**
 * The request body must include:
 *  - email
 *  - password
 *  - name
 *  - role (optional; defaults to 'student')
 *
 * Creates a new user. If successful, returns their data plus a JWT token.
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { email, password, name, role } = req.body;

    // Validate password length
    if (!password || password.length < 6) {
        return res
            .status(400)
            .json(new ApiResponse(400, "Password must be at least 6 characters long"));
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        // Check if email is associated with a different role
        if (existingUser.role !== role) {
            return res
                .status(400)
                .json(
                    new ApiResponse(
                        400,
                        `The email "${email}" is already registered with the role "${existingUser.role}". Please use a different email or contact support.`
                    )
                );
        }

        // If same role, return a general error
        return res
            .status(400)
            .json(new ApiResponse(400, "User already exists"));
    }

    // Create user
    const newUser = await User.create({ email, password, name, role });
    console.log("New user created:", newUser);

    // Return user data with token
    res.status(201).json(
        new ApiResponse(201, "User registered successfully", {
            _id: newUser._id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            token: generateToken(newUser._id),
        })
    );
});

/* -------------------------------------------------------------------------- */
/*                                LOGIN USER                                  */
/* -------------------------------------------------------------------------- */
/**
 * The request body must include:
 *  - email
 *  - password
 *
 * Verifies credentials. If valid, returns the user plus a JWT token.
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;
    console.log("email ", email)
    console.log("password ", password)
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        // Successful login
        res.status(200).json(
            new ApiResponse(200, "User logged in successfully", {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                imageUrl: user.imageUrl,
                token: generateToken(user._id),
            })
        );
    } else {
        // Invalid credentials
        res
            .status(401)
            .json(new ApiResponse(401, "Invalid email or password"));
    }
});
