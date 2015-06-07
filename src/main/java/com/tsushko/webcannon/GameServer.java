package com.tsushko.webcannon;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;

@ServerEndpoint("/gameendpoint")
public class GameServer {
    /**
     * @OnOpen allows us to intercept the creation of a new session.
     * The session class allows us to send data to the user.
     * In the method onOpen, we'll let the user know that the handshake was
     * successful.
     */
    @OnOpen
    public void onOpen(Session session){
        System.out.println(session.getId() + " has opened a connection");
    }

    /**
     * When a user sends a message to the server, this method will intercept the message
     * and allow us to react to it. For now the message is read as a String.
     */
    @OnMessage
    public void onMessage(String message, Session session){
        System.out.println("Message from " + session.getId() + ": " + message);
        String[] parameters = message.split(" ");
        double offsetX = Double.parseDouble(parameters[0]);
        double offsetY = Double.parseDouble(parameters[1]);
        double angle = Double.parseDouble(parameters[2]);
        String trajectory = getTrajectory(offsetX,offsetY,angle);
        try {
            session.getBasicRemote().sendText(trajectory);
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    /**
     * The user closes the connection.
     *
     * Note: you can't send messages to the client from this method
     */
    @OnClose
    public void onClose(Session session){
        System.out.println("Session "+session.getId()+" has ended");
    }

    private String getTrajectory(double offsetX, double offsetY, double angle) {
        StringBuilder builder = new StringBuilder();
        angle = angle % Math.PI;
        double deltaX = 1;
        double deltaResultX = -deltaX;
        if (angle > Math.PI / 2) {
            deltaResultX = -deltaResultX;
            angle = Math.PI - angle;
        }
        final double G = 9.81;
        final double speed = 80;
        final double tg = Math.tan(angle);
        final double cos = Math.cos(angle);
        final double coef = - G / (2 * speed * speed * cos * cos);
        for(
                double x = 0, resultX = offsetX, resultY = offsetY;
                resultY >= 0;
                x += deltaX, resultX += deltaResultX) {
            if(x != 0)
                builder.append(" ");
            resultY = tg * x + coef * x * x + offsetY;
            builder.append(resultX);
            builder.append(" ");
            builder.append(resultY);
        }

        return builder.toString();
    }
}