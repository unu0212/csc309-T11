'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const process = require('process');

const prisma = new PrismaClient();

function passwordValidator(password){
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return regex.test(password)
}

async function create(utorid, email, password) {
    try {
        
        if(!passwordValidator(password)){
            return "Password must be strong";
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ utorid }, { email }] }
        });

        if (existingUser) {
            console.log('Error: A user with this utorid or email already exists.');
            return;
        }

        
        await prisma.user.create({
            data: {
                name: utorid,
                utorid,
                email,
                password: hashedPassword,
                role: "superuser"
            }
        });

        console.log(` ${utorid} created successfully.`);
    } catch (error) {
        console.error('Error creating :', error);
    } finally {
        await prisma.$disconnect();
    }
}


if (process.argv.length !== 5) {
    console.log('Usage: node prisma/createsu.js <utorid> <email> <password>');
    process.exit(1);
}


const [utorid, email, password] = process.argv.slice(2);


create(utorid, email, password);
