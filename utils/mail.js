import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) =>{
    const mailGenerator=new Mailgen({
        theme:"default",
        product: {
            name:"Task Manager",
             link:"https://taskmanagerlink.com"
        }

    })
    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)

    const emailHtml=mailGenerator.generatePlaintext(options.mailgenContent)

    const transporter=nodemailer.createTransport({
        host:process.env.MAILTRAP_SMTP_HOST,
        port:process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass:process.env.MAILTRAP_SMTP_PASS
        }
    })

    const mail = {
        from:"mail.taskmanager@example.com",
        to:options.email,
        siubject:options.siubject,
        text:emailTextual,
        html:emailHtml
    }

    try{
        await transporter.sendMail(mail)
    }catch(errror){
        console.error("Email service failed")
        console.error("Error",errror)

    };
}

const emailVerificationMailgenContent = (username,verificationUrl) =>{
    return {
        body: {
            name:username,
            intro:"welcome to the app",
            action :{
                instructions: "To verify the email click on the button",
                button:{
                    color :"#22BC66",
                    text:"Verify your email",
                    link: verificationUrl
                },
            },
            outro:"Need help"

        },
    };
};

const forgotPasswordMailgenContent = (username,passwordResetUrl)  =>{
    return {
        body:{
            name:username,
            intro:"we got a request to rest your password",
            action:{
                instructions: "To reset your password kindly click the button",
                button:{
                    color:"#22BC66",
                    text:"Reset password ",
                    link:passwordResetUrl,
                }
            },
            outro:"Need help",
        },
        
    }
};

export {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail
}
