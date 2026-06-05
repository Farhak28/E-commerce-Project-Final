using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Domain.Contracts;
using StackExchange.Redis;

namespace ECommerce.Persistence.Repositories
{
    public class CacheRepository : ICacheRepository
    {
        private readonly IDatabase _database;
        private readonly IConnectionMultiplexer _connection;

        public CacheRepository(IConnectionMultiplexer connection)
        {
            _connection = connection;
            _database = connection.GetDatabase();
        }

        public async Task<string?> GetAsync(string cacheKey)
        {
            var cacheValue = await _database.StringGetAsync(cacheKey);

            return cacheValue.IsNullOrEmpty ? null : cacheValue.ToString();
        }

        public async Task SetAsync(string cacheKey, string cacheValue, TimeSpan timeToLive)
        {
            await _database.StringSetAsync(cacheKey, cacheValue, timeToLive);
        }

        public async Task RemoveByPrefixAsync(string keyPrefix)
        {
            foreach (var endpoint in _connection.GetEndPoints())
            {
                var server = _connection.GetServer(endpoint);
                if (!server.IsConnected || server.IsReplica)
                    continue;

                var keys = server.Keys(pattern: $"{keyPrefix}*").ToArray();
                if (keys.Length == 0)
                    continue;

                await _database.KeyDeleteAsync(keys);
            }

            await Task.CompletedTask;
        }
    }
}
