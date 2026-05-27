const { execSync } = require('child_process');

const ports = [5173, 8080];

console.log('🧹 Limpando portas ' + ports.join(', ') + '...');

ports.forEach(port => {
    try {
        // Encontra o PID usando o netstat
        const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
        const lines = stdout.split('\n');
        
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            
            if (pid && !isNaN(pid) && pid !== '0') {
                console.log(`🔫 Matando processo ${pid} na porta ${port}`);
                try {
                    execSync(`taskkill /F /PID ${pid} /T`);
                } catch (e) {
                    // Ignora se o processo já morreu
                }
            }
        });
    } catch (e) {
        // Ninguém usando a porta, tudo certo
    }
});

console.log('✅ Portas liberadas!');
