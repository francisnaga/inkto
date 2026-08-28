package com.inkto.app;

import android.os.Bundle;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import java.io.PrintWriter;
import java.io.StringWriter;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread thread, Throwable e) {
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                final String crashLog = sw.toString();
                System.err.println("FATAL CRASH: " + crashLog);
                
                // Try to show a toast
                new Thread() {
                    @Override
                    public void run() {
                        android.os.Looper.prepare();
                        Toast.makeText(getApplicationContext(), "CRASH: " + e.getMessage(), Toast.LENGTH_LONG).show();
                        android.os.Looper.loop();
                    }
                }.start();
                
                try {
                    Thread.sleep(4000); // Wait for toast
                } catch (InterruptedException ex) {}
                
                System.exit(2);
            }
        });
        
        super.onCreate(savedInstanceState);
    }
}
